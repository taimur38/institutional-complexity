import { useEffect, useState } from "react";
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import type { PCKey, PCRow, ScalarPoint } from "../types";

// pc_scores.parquet is wide (~330 KB): iso3, year, pc1..pc5 — one row per
// country-year. We fetch & parse the whole file once on first use, then
// hold an indexed Map<iso3, PCRow[]> in module-level memory keyed by ISO3
// for O(1) per-country slicing across both the country-profile trajectory
// charts and the (planned) animated scatter page.

type IsoIndex = Map<string, PCRow[]>;

let cache: IsoIndex | null = null;
let inflight: Promise<IsoIndex> | null = null;

async function loadIndex(): Promise<IsoIndex> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const file = await asyncBufferFromUrl({ url: "/pc_scores.parquet" });
    const rows = (await parquetReadObjects({ file })) as PCRow[];
    const idx: IsoIndex = new Map();
    for (const r of rows) {
      let series = idx.get(r.iso3);
      if (!series) {
        series = [];
        idx.set(r.iso3, series);
      }
      series.push(r);
    }
    for (const series of idx.values()) {
      series.sort((a, b) => a.year - b.year);
    }
    cache = idx;
    return idx;
  })();
  return inflight;
}

export type PCScoresState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      getRows: (iso3: string) => PCRow[];
      getSeries: (iso3: string, key: PCKey) => ScalarPoint[];
    }
  | { status: "error"; error: Error };

/**
 * Load the PC scores parquet into memory once. `enabled` defaults to true
 * because the country-profile page wants the data on mount. The scatter
 * page can also use this hook with the same shared cache.
 */
export function usePCScores(enabled = true): PCScoresState {
  const [state, setState] = useState<PCScoresState>(
    cache ? makeReady(cache) : { status: "idle" },
  );

  useEffect(() => {
    if (!enabled) return;
    if (cache) {
      setState(makeReady(cache));
      return;
    }
    let alive = true;
    setState({ status: "loading" });
    loadIndex()
      .then((idx) => {
        if (alive) setState(makeReady(idx));
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

function makeReady(idx: IsoIndex): PCScoresState {
  return {
    status: "ready",
    getRows: (iso3) => idx.get(iso3) ?? [],
    getSeries: (iso3, key) =>
      (idx.get(iso3) ?? []).map((r) => ({ year: r.year, value: r[key] })),
  };
}
