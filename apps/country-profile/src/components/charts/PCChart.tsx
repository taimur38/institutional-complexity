import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScalarPoint } from "../../types";
import { useChartZoom } from "../../lib/useChartZoom";
import { GL, GL_PEER_PALETTE } from "../../lib/glTokens";
import { ZoomResetButton } from "./ZoomResetButton";

type Series = {
  iso3: string;
  name: string;
  series: ScalarPoint[] | undefined;
};

type Row = { year: number } & Record<string, number | null>;

function buildRows(focus: Series, peers: Series[]): Row[] {
  const yearSet = new Set<number>();
  const byIso = new Map<string, Map<number, number>>();
  for (const s of [focus, ...peers]) {
    if (!s.series) continue;
    const m = new Map<number, number>();
    for (const p of s.series) {
      m.set(p.year, p.value);
      yearSet.add(p.year);
    }
    byIso.set(s.iso3, m);
  }
  return [...yearSet]
    .sort((a, b) => a - b)
    .map((y) => {
      const row: Row = { year: y };
      for (const s of [focus, ...peers]) {
        const v = byIso.get(s.iso3)?.get(y);
        row[s.iso3] = v === undefined ? null : v;
      }
      return row;
    });
}

type Props = {
  focus: Series;
  peers: Series[];
  breakYears: number[] | undefined;
};

export function PCChart({ focus, peers, breakYears }: Props) {
  const rows = useMemo(() => buildRows(focus, peers), [focus, peers]);
  const zoom = useChartZoom();
  const focusHasData = (focus.series?.length ?? 0) > 0;

  return (
    <div className="relative h-56 w-full">
      <ZoomResetButton show={zoom.isZoomed} onReset={zoom.reset} />
      <ResponsiveContainer>
        <LineChart
          data={rows}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
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
            domain={["auto", "auto"]}
            allowDataOverflow
            tick={{ fontSize: 11, fill: GL.muted }}
            tickLine={false}
            tickFormatter={(v) => (v as number).toFixed(0)}
            width={40}
          />
          <Tooltip
            formatter={(v, name) => [
              v === null ? "—" : (v as number).toFixed(2),
              name as string,
            ]}
            labelFormatter={(y) => `Year ${y}`}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke={GL.border} strokeWidth={1} />
          {breakYears?.map((y) => (
            <ReferenceLine
              key={`brk-${y}`}
              x={y}
              stroke={GL.muted}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}
          {peers.map((p, i) => (
            <Line
              key={p.iso3}
              name={p.name}
              type="monotone"
              dataKey={p.iso3}
              stroke={GL_PEER_PALETTE[i % GL_PEER_PALETTE.length]}
              strokeOpacity={0.6}
              strokeWidth={1.2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}
          <Line
            name={focus.name}
            type="monotone"
            dataKey={focus.iso3}
            stroke={GL.blue}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
            connectNulls={false}
          />
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
      {!focusHasData && (
        <p className="mt-1 text-xs text-gl-muted">
          No PC data for {focus.name}.
        </p>
      )}
    </div>
  );
}
