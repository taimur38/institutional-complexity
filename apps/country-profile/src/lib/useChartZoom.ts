import { useState } from "react";

// Drag-to-zoom hook for recharts LineCharts. The user drags horizontally
// across the plot; mouseup commits an X-domain. Y-axis is left in 'auto'
// mode so it rescales to fit, which gives a 2D-rectangle feel without
// needing to compute y-values from pixel coords (recharts' MouseEvent
// doesn't expose that). Double-click resets.

export type ZoomDomain = [number | string, number | string];

type RechartsMouseEvent = {
  activeLabel?: number | string;
} | null;

export function useChartZoom(initialDomain?: ZoomDomain) {
  const fallback: ZoomDomain = initialDomain ?? ["dataMin", "dataMax"];
  const [domain, setDomain] = useState<[number, number] | null>(null);
  const [refLeft, setRefLeft] = useState<number | null>(null);
  const [refRight, setRefRight] = useState<number | null>(null);

  const onMouseDown = (e: RechartsMouseEvent) => {
    const x = e?.activeLabel;
    if (typeof x === "number") {
      setRefLeft(x);
      setRefRight(x);
    }
  };
  const onMouseMove = (e: RechartsMouseEvent) => {
    const x = e?.activeLabel;
    if (refLeft !== null && typeof x === "number") setRefRight(x);
  };
  const onMouseUp = () => {
    if (refLeft !== null && refRight !== null && refLeft !== refRight) {
      const lo = Math.min(refLeft, refRight);
      const hi = Math.max(refLeft, refRight);
      setDomain([lo, hi]);
    }
    setRefLeft(null);
    setRefRight(null);
  };
  const onMouseLeave = () => {
    setRefLeft(null);
    setRefRight(null);
  };
  const reset = () => setDomain(null);

  return {
    xDomain: (domain ?? fallback) as ZoomDomain,
    isZoomed: domain !== null,
    refLeft,
    refRight,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    reset,
  };
}
