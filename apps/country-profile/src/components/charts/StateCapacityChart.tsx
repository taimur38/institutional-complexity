import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StateCapacityRecord } from "../../types";
import { useChartZoom } from "../../lib/useChartZoom";
import { GL, GL_PEER_PALETTE } from "../../lib/glTokens";
import { ZoomResetButton } from "./ZoomResetButton";

const DEFAULT_X_DOMAIN: [number, string] = [1960, "dataMax"];

type Props = {
  focus: { iso3: string; name: string; record: StateCapacityRecord | undefined };
  peers: {
    iso3: string;
    name: string;
    record: StateCapacityRecord | undefined;
  }[];
  breakYears: number[] | undefined;
};

type Row = {
  year: number;
  // Focus point estimate + lower bound + band width (stacked to draw ±1 SD).
  focus: number | null;
  focusLo: number | null;
  focusBand: number | null;
} & Record<string, number | null>;

function buildRows(
  focus: { iso3: string; record: StateCapacityRecord | undefined },
  peers: { iso3: string; record: StateCapacityRecord | undefined }[],
): Row[] {
  const yearSet = new Set<number>();
  type FocusVal = { value: number; sd: number };
  const focusByYear = new Map<number, FocusVal>();
  if (focus.record) {
    for (const p of focus.record.capacity) {
      focusByYear.set(p.year, { value: p.value, sd: p.sd });
      yearSet.add(p.year);
    }
  }
  const peerMaps = new Map<string, Map<number, number>>();
  for (const { iso3, record } of peers) {
    if (!record) continue;
    const m = new Map<number, number>();
    for (const p of record.capacity) {
      m.set(p.year, p.value);
      yearSet.add(p.year);
    }
    peerMaps.set(iso3, m);
  }

  return [...yearSet]
    .sort((a, b) => a - b)
    .map((y) => {
      const fv = focusByYear.get(y);
      const row: Row = {
        year: y,
        focus: fv ? fv.value : null,
        focusLo: fv ? fv.value - fv.sd : null,
        focusBand: fv ? 2 * fv.sd : null,
      };
      for (const { iso3 } of peers) {
        const v = peerMaps.get(iso3)?.get(y);
        row[iso3] = v === undefined ? null : v;
      }
      return row;
    });
}

export function StateCapacityChart({ focus, peers, breakYears }: Props) {
  const rows = useMemo(() => buildRows(focus, peers), [focus, peers]);
  const zoom = useChartZoom(DEFAULT_X_DOMAIN);
  const focusHasData = (focus.record?.capacity?.length ?? 0) > 0;

  return (
    <div className="relative h-72 w-full">
      <ZoomResetButton show={zoom.isZoomed} onReset={zoom.reset} />
      <ResponsiveContainer>
        <ComposedChart
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
            width={36}
            tickFormatter={(v) => (v as number).toFixed(1)}
          />
          <Tooltip
            formatter={(v, name) => {
              if (name === "focusLo" || name === "focusBand") return [null, null];
              return [v === null ? "—" : (v as number).toFixed(2), name as string];
            }}
            labelFormatter={(y) => `Year ${y}`}
            contentStyle={{ fontSize: 11 }}
          />
          <ReferenceLine y={0} stroke={GL.muted} strokeOpacity={0.5} />
          {breakYears?.map((y) => (
            <ReferenceLine
              key={`brk-${y}`}
              x={y}
              stroke={GL.muted}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}
          {/* ±1 SD band: invisible lower bound + visible 2*sd band stacked on top. */}
          <Area
            type="monotone"
            dataKey="focusLo"
            stackId="band"
            stroke="none"
            fill="none"
            isAnimationActive={false}
            connectNulls={false}
            activeDot={false}
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="focusBand"
            stackId="band"
            stroke="none"
            fill={GL.blue}
            fillOpacity={0.15}
            isAnimationActive={false}
            connectNulls={false}
            activeDot={false}
            legendType="none"
          />
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
            dataKey="focus"
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
        </ComposedChart>
      </ResponsiveContainer>
      {!focusHasData && (
        <p className="absolute inset-x-0 bottom-0 px-1 text-[11px] text-gl-muted">
          No data for {focus.name}.
        </p>
      )}
    </div>
  );
}
