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
import type { VDemRecord } from "../../types";
import { useChartZoom } from "../../lib/useChartZoom";
import { GL, GL_PEER_PALETTE } from "../../lib/glTokens";
import { ZoomResetButton } from "./ZoomResetButton";

const DEFAULT_VDEM_DOMAIN: [number, string] = [1940, "dataMax"];


type Props = {
  tag: string;
  label: string;
  question?: string | null;
  description?: string | null;
  focus: { iso3: string; name: string; record: VDemRecord | undefined };
  peers: { iso3: string; name: string; record: VDemRecord | undefined }[];
  breakYears: number[] | undefined;
};

type Row = { year: number } & Record<string, number | null>;

function buildRows(tag: string, series: { iso3: string; record: VDemRecord | undefined }[]): Row[] {
  const yearSet = new Set<number>();
  const byIso = new Map<string, Map<number, number>>();
  for (const { iso3, record } of series) {
    if (!record) continue;
    const m = new Map<number, number>();
    const points = record[tag] as { year: number; value: number }[] | undefined;
    if (!points) continue;
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

export function VDemChart({
  tag,
  label,
  question,
  description,
  focus,
  peers,
  breakYears,
}: Props) {
  const rows = useMemo(
    () =>
      buildRows(tag, [
        { iso3: focus.iso3, record: focus.record },
        ...peers,
      ]),
    [tag, focus, peers],
  );

  const zoom = useChartZoom(DEFAULT_VDEM_DOMAIN);
  const focusHasData = (focus.record?.[tag]?.length ?? 0) > 0;

  const hasDef = Boolean(question || description);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between px-1">
        <h4 className="text-sm font-medium">{label}</h4>
        <span className="font-mono text-[10px] text-gl-muted">{tag}</span>
      </div>
      {hasDef && (
        <details className="group mb-1 px-1 text-[11px] leading-snug text-gl-muted">
          <summary className="cursor-pointer list-none select-none text-gl-muted hover:text-gl-text">
            <span className="inline-block w-2 text-gl-muted group-open:hidden">▸</span>
            <span className="hidden w-2 text-gl-muted group-open:inline-block">▾</span>{" "}
            {question ? <em>{question}</em> : "Definition"}
          </summary>
          {description && <p className="mt-1 pl-3">{description}</p>}
        </details>
      )}
      <div className="relative h-44 w-full">
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
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tick={{ fontSize: 10, fill: GL.muted }}
              tickLine={false}
              width={28}
              tickFormatter={(v) => v.toFixed(2)}
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
      </div>
      {!focusHasData && (
        <p className="mt-1 px-1 text-[11px] text-gl-muted">
          No data for {focus.name}.
        </p>
      )}
    </div>
  );
}

