import { useEffect, useState } from "react";
import type { VDemRecord } from "../types";

// Module-level cache so we don't refetch per-country files when the user
// flips the peer-overlay toggle on and off, or jumps between profile pages.
const cache = new Map<string, VDemRecord | null>();
const inflight = new Map<string, Promise<VDemRecord | null>>();

async function fetchOne(iso3: string): Promise<VDemRecord | null> {
  if (cache.has(iso3)) return cache.get(iso3)!;
  const existing = inflight.get(iso3);
  if (existing) return existing;
  const p = fetch(`/vdem/${iso3}.json`)
    .then((r) => (r.ok ? (r.json() as Promise<VDemRecord>) : null))
    .catch(() => null)
    .then((rec) => {
      cache.set(iso3, rec);
      inflight.delete(iso3);
      return rec;
    });
  inflight.set(iso3, p);
  return p;
}

// Fetch a set of ISO3s, returning a record map. Re-renders when new data
// lands. Stable reference for unchanged ISO3 sets.
export function useVdem(isos: string[]): Record<string, VDemRecord> {
  const [records, setRecords] = useState<Record<string, VDemRecord>>(() => {
    const init: Record<string, VDemRecord> = {};
    for (const iso of isos) {
      const cached = cache.get(iso);
      if (cached) init[iso] = cached;
    }
    return init;
  });

  useEffect(() => {
    let cancelled = false;
    const missing = isos.filter((iso) => !cache.get(iso));
    if (missing.length === 0) {
      // Still ensure state matches the requested set (cached hits).
      const next: Record<string, VDemRecord> = {};
      for (const iso of isos) {
        const r = cache.get(iso);
        if (r) next[iso] = r;
      }
      setRecords(next);
      return;
    }
    Promise.all(missing.map(fetchOne)).then(() => {
      if (cancelled) return;
      const next: Record<string, VDemRecord> = {};
      for (const iso of isos) {
        const r = cache.get(iso);
        if (r) next[iso] = r;
      }
      setRecords(next);
    });
    return () => {
      cancelled = true;
    };
  }, [isos.join(",")]);

  return records;
}
