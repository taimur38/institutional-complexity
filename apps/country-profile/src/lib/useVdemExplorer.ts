import { useEffect, useState } from "react";
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";
import type { ScalarPoint } from "../types";

// The explorer panel ships one long-format parquet keyed (iso3, year, tag,
// value). On first use we fetch & parse the whole file (~5 MB), then keep an
// indexed Map<tag, Map<iso3, ScalarPoint[]>> in module-level memory. Any
// subsequent indicator selection — for any country combination — is an O(1)
// Map lookup with no network or parsing.

type TagIndex = Map<string, Map<string, ScalarPoint[]>>;

let cache: TagIndex | null = null;
let inflight: Promise<TagIndex> | null = null;

async function loadIndex(): Promise<TagIndex> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const file = await asyncBufferFromUrl({ url: "/vdem_explorer.parquet" });
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
    // Rows came in (tag, iso3, year) order from R, but sort defensively.
    for (const byIso of idx.values()) {
      for (const series of byIso.values()) {
        series.sort((a, b) => a.year - b.year);
      }
    }
    cache = idx;
    return idx;
  })();
  return inflight;
}

export type VdemExplorerState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; getSeries: (tag: string, iso3: string) => ScalarPoint[] }
  | { status: "error"; error: Error };

/**
 * `enabled` flips the loader on. The component should pass `false` until the
 * Explorer panel is actually opened so we don't pay the 5 MB download on
 * every page load.
 */
export function useVdemExplorer(enabled: boolean): VdemExplorerState {
  const [state, setState] = useState<VdemExplorerState>(
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

function makeReady(idx: TagIndex): VdemExplorerState {
  return {
    status: "ready",
    getSeries: (tag, iso3) => idx.get(tag)?.get(iso3) ?? [],
  };
}
