type Props = { show: boolean; onReset: () => void };

// Floating "reset zoom" affordance for charts. Positioned absolutely in the
// top-right of the chart's positioning context. Caller wraps the chart in a
// `relative` container.
export function ZoomResetButton({ show, onReset }: Props) {
  if (!show) return null;
  return (
    <button
      onClick={onReset}
      className="absolute right-2 top-1 z-10 rounded border border-gl-border bg-white/90 px-1.5 py-0.5 text-[10px] text-gl-muted shadow-sm hover:text-gl-text"
      title="Reset zoom (or double-click chart)"
    >
      Reset zoom
    </button>
  );
}
