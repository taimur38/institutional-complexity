import { useMemo } from "react";
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthRecord, SectoralPoint } from "../../types";
import { useChartZoom } from "../../lib/useChartZoom";
import { GL, GL_SECTORS } from "../../lib/glTokens";
import { ZoomResetButton } from "./ZoomResetButton";

type SectorKey = keyof Omit<SectoralPoint, "year">;

const SECTORS: { key: SectorKey; label: string; color: string }[] = [
  { key: "agr", label: "Agriculture", color: GL_SECTORS.agriculture },
  { key: "ind", label: "Industry", color: GL_SECTORS.industry },
  { key: "srv", label: "Services", color: GL_SECTORS.services },
];

const fmtBig = (v: number) => {
  if (!isFinite(v) || v === 0) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}k`;
  return v.toFixed(0);
};

const fmtPct = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

// Compound annual growth rate of a level series between two endpoints.
// Returns null if either endpoint is missing/invalid (sectoral series start
// in 1991 for many countries — periods that begin earlier won't have a left
// endpoint, and CAGR is undefined for non-positive levels).
function cagr(start: number | null | undefined, end: number | null | undefined, years: number) {
  if (
    start == null ||
    end == null ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start <= 0 ||
    end <= 0 ||
    years <= 0
  ) {
    return null;
  }
  return Math.pow(end / start, 1 / years) - 1;
}

// For each break period, the per-sector CAGR. Returns one entry per period
// with .mid (label x-position) plus a CAGR per sector (or null).
function buildPeriodGrowth(
  data: SectoralPoint[],
  periods: { start: number; end: number }[],
) {
  if (periods.length === 0) return [];
  const byYear = new Map<number, SectoralPoint>();
  for (const d of data) byYear.set(d.year, d);
  return periods.map((p) => {
    const startPt = byYear.get(p.start);
    const endPt = byYear.get(p.end);
    const years = p.end - p.start;
    const out: { mid: number } & Record<SectorKey, number | null> = {
      mid: (p.start + p.end) / 2,
      agr: cagr(startPt?.agr, endPt?.agr, years),
      ind: cagr(startPt?.ind, endPt?.ind, years),
      srv: cagr(startPt?.srv, endPt?.srv, years),
    };
    return out;
  });
}

type Props = {
  record: GrowthRecord;
  mode: "va" | "productivity";
};

export function SectoralChart({ record, mode }: Props) {
  const data =
    mode === "va" ? record.sectoral_va : record.sectoral_productivity;
  const breaks = record.breaks;
  const zoom = useChartZoom();
  const periodGrowth = useMemo(
    () => buildPeriodGrowth(data, breaks?.periods ?? []),
    [data, breaks],
  );

  if (data.length === 0) {
    return (
      <p className="text-sm text-gl-muted">
        No {mode === "va" ? "sectoral value-added" : "labour productivity"}{" "}
        data available.
      </p>
    );
  }

  return (
    <div className="relative h-80 w-full">
      <ZoomResetButton show={zoom.isZoomed} onReset={zoom.reset} />
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 50, right: 16, left: 4, bottom: 4 }}
          onMouseDown={zoom.onMouseDown}
          onMouseMove={zoom.onMouseMove}
          onMouseUp={zoom.onMouseUp}
          onMouseLeave={zoom.onMouseLeave}
          onDoubleClick={zoom.reset}
        >
          <CartesianGrid stroke={GL.border} strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            type="number"
            domain={zoom.xDomain}
            allowDataOverflow
            tick={{ fontSize: 11, fill: GL.muted }}
            tickLine={false}
          />
          <YAxis
            scale="log"
            domain={["auto", "auto"]}
            allowDataOverflow
            tick={{ fontSize: 11, fill: GL.muted }}
            tickLine={false}
            tickFormatter={fmtBig}
            width={56}
          />
          <Tooltip
            formatter={(v) => fmtBig(v as number)}
            labelFormatter={(y) => `Year ${y}`}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend
            verticalAlign="bottom"
            height={24}
            wrapperStyle={{ fontSize: 12 }}
          />
          {breaks?.years.map((y) => (
            <ReferenceLine
              key={`brk-${y}`}
              x={y}
              stroke={GL.muted}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}
          {periodGrowth.flatMap((p, i) =>
            SECTORS.flatMap((s, idx) => {
              const v = p[s.key];
              if (v === null) return [];
              return [
                <ReferenceLine
                  key={`pavg-${i}-${s.key}`}
                  x={p.mid}
                  stroke="transparent"
                  ifOverflow="extendDomain"
                >
                  <Label
                    value={fmtPct(v)}
                    position="top"
                    dy={idx * 13 - 38}
                    fill={s.color}
                    style={{ fontSize: 10, fontWeight: 600 }}
                  />
                </ReferenceLine>,
              ];
            }),
          )}
          {SECTORS.map((s) => (
            <Line
              key={s.key}
              name={s.label}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={1.6}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
          {zoom.refLeft !== null && zoom.refRight !== null && (
            <ReferenceArea
              x1={zoom.refLeft}
              x2={zoom.refRight}
              strokeOpacity={0.3}
              fill={GL.blue}
              fillOpacity={0.1}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
