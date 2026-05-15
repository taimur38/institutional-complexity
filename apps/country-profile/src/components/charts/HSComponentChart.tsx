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
import type { IndicatorSeriesRecord } from "../../types";
import { useChartZoom } from "../../lib/useChartZoom";
import { GL, GL_PEER_PALETTE } from "../../lib/glTokens";
import { ZoomResetButton } from "./ZoomResetButton";

const DEFAULT_X_DOMAIN: [number, string] = [1960, "dataMax"];

type Props = {
  tag: string;
  focus: {
    iso3: string;
    name: string;
    record: IndicatorSeriesRecord | undefined;
  };
  peers: {
    iso3: string;
    name: string;
    record: IndicatorSeriesRecord | undefined;
  }[];
  breakYears: number[] | undefined;
};

type Row = { year: number } & Record<string, number | null>;

function buildRows(
  tag: string,
  series: { iso3: string; record: IndicatorSeriesRecord | undefined }[],
): Row[] {
  const yearSet = new Set<number>();
  const byIso = new Map<string, Map<number, number>>();
  for (const { iso3, record } of series) {
    const points = record?.series?.[tag];
    if (!points) continue;
    const m = new Map<number, number>();
    for (const p of points) {
      m.set(p.year, p.value);
      yearSet.add(p.year);
    }
    byIso.set(iso3, m);
  }
  return [...yearSet]
    .sort((a, b) => a - b)
    .map((y) => {
      const row: Row = { year: y };
      for (const { iso3 } of series) {
        const v = byIso.get(iso3)?.get(y);
        row[iso3] = v === undefined ? null : v;
      }
      return row;
    });
}

export function HSComponentChart({ tag, focus, peers, breakYears }: Props) {
  const rows = useMemo(
    () =>
      buildRows(tag, [
        { iso3: focus.iso3, record: focus.record },
        ...peers,
      ]),
    [tag, focus, peers],
  );

  const zoom = useChartZoom(DEFAULT_X_DOMAIN);
  const focusHasData = (focus.record?.series?.[tag]?.length ?? 0) > 0;

  return (
    <div className="relative h-56 w-full">
      <ZoomResetButton show={zoom.isZoomed} onReset={zoom.reset} />
      <ResponsiveContainer>
        <LineChart
          data={rows}
          margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
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
            tick={{ fontSize: 10, fill: GL.muted }}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fontSize: 10, fill: GL.muted }}
            tickLine={false}
            width={40}
            tickFormatter={(v) => {
              const n = v as number;
              if (Math.abs(n) >= 100) return n.toFixed(0);
              if (Math.abs(n) >= 10) return n.toFixed(1);
              return n.toFixed(2);
            }}
          />
          <Tooltip
            formatter={(v, name) => [
              v === null ? "—" : (v as number).toFixed(3),
              name as string,
            ]}
            labelFormatter={(y) => `Year ${y}`}
            contentStyle={{ fontSize: 11 }}
          />
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
        <p className="absolute inset-x-0 bottom-0 px-1 text-[11px] text-gl-muted">
          No data for {focus.name} on this indicator.
        </p>
      )}
    </div>
  );
}
