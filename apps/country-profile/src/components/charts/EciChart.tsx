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
import type { GrowthRecord } from "../../types";
import { useChartZoom } from "../../lib/useChartZoom";
import { GL } from "../../lib/glTokens";
import { ZoomResetButton } from "./ZoomResetButton";

type Props = { record: GrowthRecord };

export function EciChart({ record }: Props) {
  const data = record.eci;
  const breaks = record.breaks;
  const zoom = useChartZoom();

  if (data.length === 0) {
    return <p className="text-sm text-gl-muted">No ECI data available.</p>;
  }

  return (
    <div className="relative h-64 w-full">
      <ZoomResetButton show={zoom.isZoomed} onReset={zoom.reset} />
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 12, right: 16, left: 4, bottom: 4 }}
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
            tickFormatter={(v) => v.toFixed(1)}
            width={48}
          />
          <Tooltip
            formatter={(v) => (v as number).toFixed(2)}
            labelFormatter={(y) => `Year ${y}`}
            contentStyle={{ fontSize: 12 }}
          />
          <ReferenceLine y={0} stroke={GL.border} strokeWidth={1} />
          {breaks?.years.map((y) => (
            <ReferenceLine
              key={`brk-${y}`}
              x={y}
              stroke={GL.muted}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ))}
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
