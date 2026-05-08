import {
  CartesianGrid,
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

const SECTORS: { key: keyof Omit<SectoralPoint, "year">; label: string; color: string }[] = [
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

type Props = {
  record: GrowthRecord;
  mode: "va" | "productivity";
};

export function SectoralChart({ record, mode }: Props) {
  const data =
    mode === "va" ? record.sectoral_va : record.sectoral_productivity;
  const breaks = record.breaks;
  const zoom = useChartZoom();

  if (data.length === 0) {
    return (
      <p className="text-sm text-gl-muted">
        No {mode === "va" ? "sectoral value-added" : "labour productivity"}{" "}
        data available.
      </p>
    );
  }

  return (
    <div className="relative h-72 w-full">
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
            verticalAlign="top"
            height={28}
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
