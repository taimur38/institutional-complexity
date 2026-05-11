import { useEffect, useState } from "react";
import { asyncBufferFromUrl, parquetReadObjects } from "hyparquet";

// fingerprints_2025.parquet is long-format (~160 KB): iso3, tag, z — one row
// per country-indicator z-score in 2025. We fetch the whole file once and
// build a nested Map<iso3, Map<tag, z>> for O(1) lookup from the peer-anomaly
// section. Same one-shot pattern as usePCScores.ts.

type FingerprintRow = { iso3: string; tag: string; z: number };
type Index = Map<string, Map<string, number>>;

let cache: Index | null = null;
let inflight: Promise<Index> | null = null;

async function loadIndex(): Promise<Index> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const file = await asyncBufferFromUrl({ url: "/fingerprints_2025.parquet" });
    const rows = (await parquetReadObjects({ file })) as FingerprintRow[];
    const idx: Index = new Map();
    for (const r of rows) {
      let row = idx.get(r.iso3);
      if (!row) {
        row = new Map();
        idx.set(r.iso3, row);
      }
      row.set(r.tag, r.z);
    }
    cache = idx;
    return idx;
  })();
  return inflight;
}

export type FingerprintsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; get: (iso3: string) => Map<string, number> | undefined }
  | { status: "error"; error: Error };

export function useFingerprints(enabled = true): FingerprintsState {
  const [state, setState] = useState<FingerprintsState>(
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

function makeReady(idx: Index): FingerprintsState {
  return { status: "ready", get: (iso3) => idx.get(iso3) };
}
