import { useEffect, useState } from "react";
import type {
  Country,
  GrowthRecord,
  PCComponent,
  PCKey,
  PCMeta,
  ScalarPoint,
} from "../types";
import { usePCScores } from "../lib/usePCScores";
import { GL, GL_PEER_PALETTE } from "../lib/glTokens";
import { PCChart } from "./charts/PCChart";

type Props = {
  focus: Country;
  peers: { iso3: string; name: string }[];
  growthRecord: GrowthRecord | null;
};

const DISPLAYED_PCS: PCKey[] = ["pc1", "pc2", "pc3"];

export function PCTrajectoriesSection({ focus, peers, growthRecord }: Props) {
  const [meta, setMeta] = useState<PCMeta | null>(null);
  const [showPeers, setShowPeers] = useState(false);
  const scores = usePCScores();

  useEffect(() => {
    fetch("/pc_meta.json")
      .then((r) => r.json() as Promise<PCMeta>)
      .then(setMeta);
  }, []);

  const breakYears = growthRecord?.breaks?.years;

  if (!meta || scores.status !== "ready") {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Institutional axes</h2>
        <p className="mt-2 text-sm text-gl-muted">
          {scores.status === "error"
            ? `Failed to load PC scores: ${scores.error.message}`
            : "Loading…"}
        </p>
      </section>
    );
  }

  const componentsByKey = new Map<PCKey, PCComponent>(
    meta.components.map((c) => [c.key, c]),
  );

  return (
    <section className="mt-12 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Institutional axes</h2>
          <p className="mt-0.5 text-xs text-gl-muted">
            Pooled-panel PCA on V-Dem 1970-{meta.panel_window[1]}
            {" — "}
            {meta.n_features} indicators across {" "}
            {meta.n_country_years.toLocaleString()} country-years.
            Together PC1-PC3 capture{" "}
            {Math.round(
              100 *
                meta.components
                  .filter((c) => DISPLAYED_PCS.includes(c.key))
                  .reduce((s, c) => s + c.var_explained, 0),
            )}
            % of total variance. y = 0 is the panel mean.
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

      {showPeers && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-gl-border bg-white px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-5"
              style={{ background: GL.blue }}
            />
            <span className="font-medium">{focus.name}</span>
          </span>
          {peers.map((p, i) => (
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
      )}

      <div className="space-y-8">
        {DISPLAYED_PCS.map((key) => {
          const comp = componentsByKey.get(key);
          if (!comp) return null;
          const focusSeries = {
            iso3: focus.iso3,
            name: focus.name,
            series: scores.getSeries(focus.iso3, key),
          };
          const peerSeries = showPeers
            ? peers.map((p) => ({
                iso3: p.iso3,
                name: p.name,
                series: scores.getSeries(p.iso3, key),
              }))
            : [];
          return (
            <PCSubsection
              key={key}
              comp={comp}
              focusSeries={focusSeries}
              peerSeries={peerSeries}
              breakYears={breakYears}
            />
          );
        })}
      </div>
    </section>
  );
}

type ChartSeries = {
  iso3: string;
  name: string;
  series: ScalarPoint[];
};

type SubsectionProps = {
  comp: PCComponent;
  focusSeries: ChartSeries;
  peerSeries: ChartSeries[];
  breakYears: number[] | undefined;
};

function PCSubsection({
  comp,
  focusSeries,
  peerSeries,
  breakYears,
}: SubsectionProps) {
  const label = comp.key.toUpperCase();
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold">
          <span className="font-mono text-xs text-gl-muted">{label}</span>{" "}
          {comp.name}
        </h3>
        <span className="text-xs text-gl-muted">
          {(comp.var_explained * 100).toFixed(1)}% of variance
        </span>
      </div>
      <p className="mb-3 text-xs text-gl-muted">{comp.short}</p>

      <PCChart
        focus={focusSeries}
        peers={peerSeries}
        breakYears={breakYears}
      />

      <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded border border-gl-border bg-white px-3 py-2">
          <p className="font-semibold text-gl-text">High end</p>
          <p className="mt-0.5 text-gl-muted">{comp.positive_pole}</p>
        </div>
        <div className="rounded border border-gl-border bg-white px-3 py-2">
          <p className="font-semibold text-gl-text">Low end</p>
          <p className="mt-0.5 text-gl-muted">{comp.negative_pole}</p>
        </div>
      </div>
    </div>
  );
}
