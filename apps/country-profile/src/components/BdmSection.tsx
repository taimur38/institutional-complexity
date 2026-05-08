import { useEffect, useState } from "react";
import type { BdmIndex, Country, GrowthRecord } from "../types";
import { BdmChart } from "./charts/BdmChart";
import { GL, GL_PEER_PALETTE } from "../lib/glTokens";

type Props = {
  focus: Country;
  peers: { iso3: string; name: string }[];
  growthRecord: GrowthRecord | null;
};

export function BdmSection({ focus, peers, growthRecord }: Props) {
  const [series, setSeries] = useState<BdmIndex | null>(null);
  const [showPeers, setShowPeers] = useState(false);

  useEffect(() => {
    fetch("/bdm_series.json")
      .then((r) => r.json() as Promise<BdmIndex>)
      .then(setSeries);
  }, []);

  if (!series) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Winning coalition (W)</h2>
        <p className="mt-2 text-sm text-gl-muted">Loading…</p>
      </section>
    );
  }

  const focusSeries = {
    iso3: focus.iso3,
    name: focus.name,
    series: series[focus.iso3],
  };
  const peerSeries = showPeers
    ? peers.map((p) => ({
        iso3: p.iso3,
        name: p.name,
        series: series[p.iso3],
      }))
    : [];

  const breakYears = growthRecord?.breaks?.years;

  return (
    <section className="mt-12 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Winning coalition size (W)</h2>
          <p className="mt-0.5 text-xs text-gl-muted">
            Bueno de Mesquita & Smith (2022) — mean of four cross-panel
            z-scored V-Dem components: election-monitoring autonomy, opposition
            autonomy, party-entry barriers, and (negated) closed-succession
            score. Higher = larger winning coalition. y = 0 is the panel mean.
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
      </div>

      <BdmChart focus={focusSeries} peers={peerSeries} breakYears={breakYears} />
    </section>
  );
}
