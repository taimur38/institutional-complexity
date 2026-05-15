import { useEffect, useState } from "react";
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import type {
  PolSettMeta,
  PolSettTypologyRow,
  ScalarPoint,
} from "../types";

// --- Typology + meta loader -------------------------------------------------
type TypologyBundle = {
  meta: PolSettMeta;
  rows: PolSettTypologyRow[];
  // Indexed for fast year-slice lookup
  byYear: Map<number, PolSettTypologyRow[]>;
  byIso: Map<string, PolSettTypologyRow[]>;
  years: number[]; // sorted unique years with data
};

let typologyCache: TypologyBundle | null = null;
let typologyInflight: Promise<TypologyBundle> | null = null;

async function loadTypology(): Promise<TypologyBundle> {
  if (typologyCache) return typologyCache;
  if (typologyInflight) return typologyInflight;
  typologyInflight = (async () => {
    const [meta, rows] = await Promise.all([
      fetch("/polsett/meta.json").then((r) => r.json() as Promise<PolSettMeta>),
      fetch("/polsett/typology.json").then(
        (r) => r.json() as Promise<PolSettTypologyRow[]>,
      ),
    ]);
    const byYear = new Map<number, PolSettTypologyRow[]>();
    const byIso = new Map<string, PolSettTypologyRow[]>();
    for (const row of rows) {
      let yr = byYear.get(row.year);
      if (!yr) {
        yr = [];
        byYear.set(row.year, yr);
      }
      yr.push(row);
      let is = byIso.get(row.iso3);
      if (!is) {
        is = [];
        byIso.set(row.iso3, is);
      }
      is.push(row);
    }
    const years = [...byYear.keys()].sort((a, b) => a - b);
    typologyCache = { meta, rows, byYear, byIso, years };
    return typologyCache;
  })();
  return typologyInflight;
}

export type PolSettTypologyState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; bundle: TypologyBundle }
  | { status: "error"; error: Error };

export function usePolSettTypology(): PolSettTypologyState {
  const [state, setState] = useState<PolSettTypologyState>(
    typologyCache
      ? { status: "ready", bundle: typologyCache }
      : { status: "idle" },
  );

  useEffect(() => {
    if (state.status === "ready") return;
    let alive = true;
    setState({ status: "loading" });
    loadTypology()
      .then((b) => {
        if (alive) setState({ status: "ready", bundle: b });
      })
      .catch((err: Error) => {
        if (alive) setState({ status: "error", error: err });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}

// --- Panel loader (for the indicator explorer) ------------------------------
type TagIndex = Map<string, Map<string, ScalarPoint[]>>;

let panelCache: TagIndex | null = null;
let panelInflight: Promise<TagIndex> | null = null;

async function loadPanel(): Promise<TagIndex> {
  if (panelCache) return panelCache;
  if (panelInflight) return panelInflight;
  panelInflight = (async () => {
    const file = await asyncBufferFromUrl({ url: "/polsett/panel.parquet" });
    const rows = (await parquetReadObjects({ file })) as Array<{
      iso3: string;
      year: number;
      tag: string;
      value: number;
    }>;
    const idx: TagIndex = new Map();
    for (const r of rows) {
      let byIso = idx.get(r.tag);
      if (!byIso) {
        byIso = new Map();
        idx.set(r.tag, byIso);
      }
      let series = byIso.get(r.iso3);
      if (!series) {
        series = [];
        byIso.set(r.iso3, series);
      }
      series.push({ year: r.year, value: r.value });
    }
    for (const byIso of idx.values()) {
      for (const series of byIso.values()) {
        series.sort((a, b) => a.year - b.year);
      }
    }
    panelCache = idx;
    return idx;
  })();
  return panelInflight;
}

export type PolSettPanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; getSeries: (tag: string, iso3: string) => ScalarPoint[] }
  | { status: "error"; error: Error };

export function usePolSettPanel(enabled: boolean): PolSettPanelState {
  const [state, setState] = useState<PolSettPanelState>(
    panelCache
      ? { status: "ready", getSeries: makeGetter(panelCache) }
      : { status: "idle" },
  );

  useEffect(() => {
    if (!enabled) return;
    if (panelCache) {
      setState({ status: "ready", getSeries: makeGetter(panelCache) });
      return;
    }
    let alive = true;
    setState({ status: "loading" });
    loadPanel()
      .then((idx) => {
        if (alive) setState({ status: "ready", getSeries: makeGetter(idx) });
      })
      .catch((err: Error) => {
        if (alive) setState({ status: "error", error: err });
      });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return state;
}

function makeGetter(idx: TagIndex) {
  return (tag: string, iso3: string) => idx.get(tag)?.get(iso3) ?? [];
}
