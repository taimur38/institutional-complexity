import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GrowthRecord } from "../../types";
import { useChartZoom } from "../../lib/useChartZoom";
import { GL } from "../../lib/glTokens";
import { ZoomResetButton } from "./ZoomResetButton";

const fmtUsd = (v: number) =>
  v >= 10000
    ? `$${(v / 1000).toFixed(1)}k`
    : v >= 1000
      ? `$${(v / 1000).toFixed(1)}k`
      : `$${v.toFixed(0)}`;

const fmtPct = (v: number) =>
  `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

type Props = { record: GrowthRecord };

export function GdpChart({ record }: Props) {
  const data = record.gdp_per_capita;
  const breaks = record.breaks;
  const zoom = useChartZoom();

  if (data.length === 0) {
    return <p className="text-sm text-gl-muted">No PWT data available.</p>;
  }

  const periods = breaks?.periods ?? [];

  return (
    <div className="relative h-72 w-full">
      <ZoomResetButton show={zoom.isZoomed} onReset={zoom.reset} />
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 24, right: 16, left: 4, bottom: 4 }}
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
            tickFormatter={fmtUsd}
            width={56}
          />
          <Tooltip
            formatter={(v) => fmtUsd(v as number)}
            labelFormatter={(y) => `Year ${y}`}
            contentStyle={{ fontSize: 12 }}
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
          {periods.map((p, i) => {
            const mid = (p.start + p.end) / 2;
            const color =
              p.passes_kar === true
                ? GL.green
                : p.passes_kar === false
                  ? GL.highlight
                  : GL.muted;
            return (
              <ReferenceLine
                key={`pavg-${i}`}
                x={mid}
                stroke="transparent"
              >
                <Label
                  value={fmtPct(p.avg_growth)}
                  position="top"
                  fill={color}
                  style={{ fontSize: 11, fontWeight: 600 }}
                />
              </ReferenceLine>
            );
          })}
          <Line
            type="monotone"
            dataKey="value"
            stroke={GL.blue}
            strokeWidth={1.6}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
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
  );
}
