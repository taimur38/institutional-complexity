import { useEffect, useMemo, useState } from "react";
import type { Country, GrowthRecord, StateCapacityMeta } from "../types";
import { useStateCapacity } from "../lib/useStateCapacity";
import { GL, GL_PEER_PALETTE } from "../lib/glTokens";
import { StateCapacityChart } from "./charts/StateCapacityChart";

type Props = {
  focus: Country;
  peers: { iso3: string; name: string }[];
  growthRecord: GrowthRecord | null;
};

export function StateCapacitySection({ focus, peers, growthRecord }: Props) {
  const [meta, setMeta] = useState<StateCapacityMeta | null>(null);
  const [showPeers, setShowPeers] = useState(false);

  useEffect(() => {
    fetch("/state_capacity_meta.json")
      .then((r) => r.json() as Promise<StateCapacityMeta>)
      .then(setMeta);
  }, []);

  const isos = useMemo(
    () => (showPeers ? [focus.iso3, ...peers.map((p) => p.iso3)] : [focus.iso3]),
    [focus.iso3, peers, showPeers],
  );
  const records = useStateCapacity(isos);

  const focusRecord = records[focus.iso3];
  const peerSeries = showPeers
    ? peers.map((p) => ({ iso3: p.iso3, name: p.name, record: records[p.iso3] }))
    : [];

  const breakYears = growthRecord?.breaks?.years;

  if (!meta) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold">State capacity</h2>
        <p className="mt-2 text-sm text-gl-muted">Loading…</p>
      </section>
    );
  }

  return (
    <section className="mt-12 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">State capacity</h2>
          <p className="mt-0.5 text-xs text-gl-muted">
            Hanson &amp; Sigman index ({meta.start_year}–{meta.end_year}).
            Shaded band shows ±1 posterior SD for {focus.name}. Vertical
            dashes mark growth-break years.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showPeers}
            onChange={(e) => setShowPeers(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          <span>Overlay peers</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-gl-border bg-white px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-5"
            style={{ background: GL.blue }}
          />
          <span className="font-medium">{focus.name}</span>
        </span>
        {showPeers &&
          peers.map((p, i) => (
            <span key={p.iso3} className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-5 opacity-60"
                style={{
                  background: GL_PEER_PALETTE[i % GL_PEER_PALETTE.length],
                }}
              />
              <span className="text-gl-muted">{p.name}</span>
            </span>
          ))}
        {!showPeers && (
          <span className="text-gl-muted">
            Toggle "Overlay peers" to compare across {peers.length} peers.
          </span>
        )}
      </div>

      <details className="group px-1 text-[11px] leading-snug text-gl-muted">
        <summary className="cursor-pointer list-none select-none hover:text-gl-text">
          <span className="inline-block w-2 group-open:hidden">▸</span>
          <span className="hidden w-2 group-open:inline-block">▾</span>{" "}
          <em>{meta.index.label}</em>{" "}
          <span className="font-mono text-[10px]">({meta.index.tag})</span>
        </summary>
        <p className="mt-1 pl-3">{meta.index.description}</p>
        <p className="mt-1 pl-3 text-gl-muted">Source: {meta.citation}</p>
      </details>

      <StateCapacityChart
        focus={{ iso3: focus.iso3, name: focus.name, record: focusRecord }}
        peers={peerSeries}
        breakYears={breakYears}
      />
    </section>
  );
}
