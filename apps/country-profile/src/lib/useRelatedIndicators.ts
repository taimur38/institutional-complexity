import { useEffect, useState } from "react";
import type { RelatedIndicatorsRecord } from "../types";

// Mirrors useHSComponents / useStateCapacity — module-level cache + in-flight
// dedup keeps focus + peer fetches cheap when toggling indicators or peers.
const cache = new Map<string, RelatedIndicatorsRecord | null>();
const inflight = new Map<string, Promise<RelatedIndicatorsRecord | null>>();

async function fetchOne(iso3: string): Promise<RelatedIndicatorsRecord | null> {
  if (cache.has(iso3)) return cache.get(iso3)!;
  const existing = inflight.get(iso3);
  if (existing) return existing;
  const p = fetch(`/related_indicators/${iso3}.json`)
    .then((r) =>
      r.ok ? (r.json() as Promise<RelatedIndicatorsRecord>) : null,
    )
    .catch(() => null)
    .then((rec) => {
      cache.set(iso3, rec);
      inflight.delete(iso3);
      return rec;
    });
  inflight.set(iso3, p);
  return p;
}

export function useRelatedIndicators(
  isos: string[],
): Record<string, RelatedIndicatorsRecord> {
  const [records, setRecords] = useState<
    Record<string, RelatedIndicatorsRecord>
  >(() => {
    const init: Record<string, RelatedIndicatorsRecord> = {};
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
      const next: Record<string, RelatedIndicatorsRecord> = {};
      for (const iso of isos) {
        const r = cache.get(iso);
        if (r) next[iso] = r;
      }
      setRecords(next);
      return;
    }
    Promise.all(missing.map(fetchOne)).then(() => {
      if (cancelled) return;
      const next: Record<string, RelatedIndicatorsRecord> = {};
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
