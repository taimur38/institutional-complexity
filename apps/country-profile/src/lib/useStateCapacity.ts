import { useEffect, useState } from "react";
import type { StateCapacityRecord } from "../types";

// Module-level cache mirroring useVdem — focus + peer files are tiny and
// frequently reused, so we hold them across the section's lifetime.
const cache = new Map<string, StateCapacityRecord | null>();
const inflight = new Map<string, Promise<StateCapacityRecord | null>>();

async function fetchOne(iso3: string): Promise<StateCapacityRecord | null> {
  if (cache.has(iso3)) return cache.get(iso3)!;
  const existing = inflight.get(iso3);
  if (existing) return existing;
  const p = fetch(`/state_capacity/${iso3}.json`)
    .then((r) => (r.ok ? (r.json() as Promise<StateCapacityRecord>) : null))
    .catch(() => null)
    .then((rec) => {
      cache.set(iso3, rec);
      inflight.delete(iso3);
      return rec;
    });
  inflight.set(iso3, p);
  return p;
}

export function useStateCapacity(
  isos: string[],
): Record<string, StateCapacityRecord> {
  const [records, setRecords] = useState<Record<string, StateCapacityRecord>>(
    () => {
      const init: Record<string, StateCapacityRecord> = {};
      for (const iso of isos) {
        const cached = cache.get(iso);
        if (cached) init[iso] = cached;
      }
      return init;
    },
  );

  useEffect(() => {
    let cancelled = false;
    const missing = isos.filter((iso) => !cache.get(iso));
    if (missing.length === 0) {
      const next: Record<string, StateCapacityRecord> = {};
      for (const iso of isos) {
        const r = cache.get(iso);
        if (r) next[iso] = r;
      }
      setRecords(next);
      return;
    }
    Promise.all(missing.map(fetchOne)).then(() => {
      if (cancelled) return;
      const next: Record<string, StateCapacityRecord> = {};
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
