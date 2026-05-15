import { useEffect, useState } from "react";
import type { HSComponentsRecord } from "../types";

// Mirrors useStateCapacity / useVdem: tiny per-country files, hot path for
// focus + peer overlays, so we keep a module-level cache and de-duplicate
// in-flight fetches.
const cache = new Map<string, HSComponentsRecord | null>();
const inflight = new Map<string, Promise<HSComponentsRecord | null>>();

async function fetchOne(iso3: string): Promise<HSComponentsRecord | null> {
  if (cache.has(iso3)) return cache.get(iso3)!;
  const existing = inflight.get(iso3);
  if (existing) return existing;
  const p = fetch(`/hs_components/${iso3}.json`)
    .then((r) => (r.ok ? (r.json() as Promise<HSComponentsRecord>) : null))
    .catch(() => null)
    .then((rec) => {
      cache.set(iso3, rec);
      inflight.delete(iso3);
      return rec;
    });
  inflight.set(iso3, p);
  return p;
}

export function useHSComponents(
  isos: string[],
): Record<string, HSComponentsRecord> {
  const [records, setRecords] = useState<Record<string, HSComponentsRecord>>(
    () => {
      const init: Record<string, HSComponentsRecord> = {};
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
      const next: Record<string, HSComponentsRecord> = {};
      for (const iso of isos) {
        const r = cache.get(iso);
        if (r) next[iso] = r;
      }
      setRecords(next);
      return;
    }
    Promise.all(missing.map(fetchOne)).then(() => {
      if (cancelled) return;
      const next: Record<string, HSComponentsRecord> = {};
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
