import { useState } from "react";
import type { GrowthRecord } from "../types";
import { GdpChart } from "./charts/GdpChart";
import { SectoralChart } from "./charts/SectoralChart";
import { EciChart } from "./charts/EciChart";

type Props = { record: GrowthRecord | null };

export function GrowthBreaksSection({ record }: Props) {
  const [mode, setMode] = useState<"va" | "productivity">("va");

  if (!record) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Growth breaks</h2>
        <p className="mt-2 text-sm text-gl-muted">
          No growth-break data for this country.
        </p>
      </section>
    );
  }

  const { breaks } = record;

  return (
    <section className="mt-12 space-y-10">
      <div>
        <h2 className="text-xl font-semibold">Growth breaks</h2>
        <p className="mt-0.5 text-xs text-gl-muted">
          Bai–Perron breaks (n=4) on PWT real GDP/capita growth. Period labels
          are mean growth; green = passes Kar (2013) acceleration filter, red =
          fails.{" "}
          {breaks
            ? `Breaks at ${breaks.years.join(", ")}.`
            : "Insufficient series length for break detection."}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">
          GDP per capita (PWT, log scale)
        </h3>
        <GdpChart record={record} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            Sectoral{" "}
            {mode === "va" ? "value added" : "labour productivity"}{" "}
            <span className="text-sm font-normal text-gl-muted">
              (constant 2015 USD, log)
            </span>
          </h3>
          <div className="inline-flex overflow-hidden rounded border border-gl-border text-xs">
            {(["va", "productivity"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 transition-colors ${
                  mode === m
                    ? "bg-gl-text text-white"
                    : "text-gl-muted hover:bg-gl-bg"
                }`}
              >
                {m === "va" ? "Levels" : "Productivity"}
              </button>
            ))}
          </div>
        </div>
        <SectoralChart record={record} mode={mode} />
        {mode === "productivity" && (
          <p className="mt-1 text-xs text-gl-muted">
            VA / (sector employment share × total labour force). Coverage starts
            from 1991 in WDI.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">
          Economic complexity (ECI, HS-4){" "}
        </h3>
        <EciChart record={record} />
      </div>
    </section>
  );
}
