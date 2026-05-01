import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Meta, Track } from "../types";
import { positionAt, trackPath, yearAtTime } from "../lib/interpolate";

type Props = {
  tracks: Track[];
  meta: Meta;
  selected: Set<string>;
  onToggle: (name: string) => void;
  focusCountry: string | null;
  trackByName: Map<string, Track>;
};

const HOVER_RADIUS_PX = 10;
const KNN_K = 4;

export function TrajectoryCanvas({
  tracks,
  meta,
  selected,
  onToggle,
  focusCountry,
  trackByName,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    elapsed: 0,
    lastTs: 0,
    playing: true,
    duration: meta.default_duration_seconds,
    year: meta.year_range[0],
  });
  const labelStateRef = useRef(
    new Map<string, { x: number; y: number; vx: number; vy: number }>(),
  );
  const [, forceTick] = useState(0);
  const [showTrails, setShowTrails] = useState(true);
  const [showNN, setShowNN] = useState(false);
  const [hoverName, setHoverName] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Latest props/state in refs so the rAF loop reads current values without
  // re-creating the loop on every change.
  const propsRef = useRef({
    tracks,
    meta,
    selected,
    focusCountry,
    trackByName,
    showTrails,
    showNN,
    hoverName,
  });
  propsRef.current = {
    tracks,
    meta,
    selected,
    focusCountry,
    trackByName,
    showTrails,
    showNN,
    hoverName,
  };

  // Resize the canvas backing store whenever the wrapper changes size.
  useLayoutEffect(() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const side = Math.max(100, Math.min(rect.width, rect.height));
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${side}px`;
      canvas.style.height = `${side}px`;
      canvas.width = Math.round(side * dpr);
      canvas.height = Math.round(side * dpr);
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  // rAF loop, mounted once. Reads dims off the canvas each frame.
  useEffect(() => {
    let raf = 0;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = parseFloat(canvas.style.width) || canvas.clientWidth;
      const H = parseFloat(canvas.style.height) || canvas.clientHeight;
      if (W < 1 || H < 1) return;

      const {
        tracks,
        meta,
        selected,
        focusCountry,
        trackByName,
        showTrails,
        showNN,
        hoverName,
      } = propsRef.current;
      const year = stateRef.current.year;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, W, H);

      // Compute current positions for all visible countries (one pass).
      type Pt = {
        name: string;
        region: string;
        x: number;
        y: number;
        px: number;
        py: number;
      };
      const visible: Pt[] = [];
      const byName = new Map<string, Pt>();
      for (const t of tracks) {
        const p = positionAt(t, year);
        if (!p.visible) continue;
        const pt: Pt = {
          name: t.name,
          region: t.region,
          x: p.x,
          y: p.y,
          px: p.x * W,
          py: p.y * H,
        };
        visible.push(pt);
        byName.set(t.name, pt);
      }

      // KNN: for each selected country, find K nearest *other* countries.
      const neighborSet = new Set<string>();
      const neighborEdges: Array<[Pt, Pt]> = [];
      if (showNN) {
        for (const sel of selected) {
          const a = byName.get(sel);
          if (!a) continue;
          const dists: Array<{ pt: Pt; d2: number }> = [];
          for (const b of visible) {
            if (b.name === sel) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            dists.push({ pt: b, d2: dx * dx + dy * dy });
          }
          dists.sort((x, y) => x.d2 - y.d2);
          for (let i = 0; i < Math.min(KNN_K, dists.length); i++) {
            const nb = dists[i].pt;
            if (selected.has(nb.name)) continue;
            neighborSet.add(nb.name);
            neighborEdges.push([a, nb]);
          }
        }
      }

      // Trails for selected + focus.
      if (showTrails) {
        const trailNames = new Set(selected);
        if (focusCountry) trailNames.add(focusCountry);
        ctx.lineWidth = 1.4;
        for (const name of trailNames) {
          const t = trackByName.get(name);
          if (!t) continue;
          const color = meta.regions[t.region] ?? "#777";
          const path = trackPath(t, meta.year_range[0], year, 60);
          if (path.length < 2) continue;
          ctx.strokeStyle = withAlpha(color, 0.4);
          ctx.beginPath();
          ctx.moveTo(path[0].x * W, path[0].y * H);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x * W, path[i].y * H);
          }
          ctx.stroke();
        }
      }

      // KNN edges (drawn under dots, above trails).
      if (neighborEdges.length) {
        ctx.strokeStyle = "rgba(80,80,80,0.35)";
        ctx.lineWidth = 0.9;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (const [a, b] of neighborEdges) {
          ctx.moveTo(a.px, a.py);
          ctx.lineTo(b.px, b.py);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Dots.
      const dotR = 3.2;
      for (const pt of visible) {
        const color = meta.regions[pt.region] ?? "#777";
        const isSelected = selected.has(pt.name);
        const isFocus = focusCountry === pt.name;
        const isHover = hoverName === pt.name;
        const isNeighbor = neighborSet.has(pt.name);
        const hi = isSelected || isFocus || isHover;
        ctx.fillStyle = hi || isNeighbor ? color : withAlpha(color, 0.55);
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, hi ? dotR + 1.5 : dotR, 0, Math.PI * 2);
        ctx.fill();
        if (hi) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Labels — force-directed: persistent positions relax each frame
      // toward a target offset above/below the dot, with pairwise overlap
      // repulsion. Persisting state across frames keeps motion smooth as
      // dots move and avoids per-frame layout flips.
      const fontFamily = getComputedStyle(document.body).fontFamily;
      const fontPrimaryStr = `600 12px ${fontFamily}`;
      const fontMutedStr = `500 11px ${fontFamily}`;

      type LabelItem = {
        name: string;
        ax: number;
        ay: number;
        targetX: number;
        targetY: number;
        halfW: number;
        halfH: number;
        color: string;
        muted: boolean;
        primary: boolean;
      };

      const labelItems: LabelItem[] = [];
      const primary = new Set(selected);
      if (focusCountry) primary.add(focusCountry);

      ctx.font = fontPrimaryStr;
      for (const name of primary) {
        const pt = byName.get(name);
        if (!pt) continue;
        const halfW = (ctx.measureText(name).width + 10) / 2;
        labelItems.push({
          name,
          ax: pt.px,
          ay: pt.py,
          targetX: pt.px,
          targetY: pt.py - 18,
          halfW,
          halfH: 10,
          color: meta.regions[pt.region] ?? "#333",
          muted: false,
          primary: true,
        });
      }

      if (showNN) {
        ctx.font = fontMutedStr;
        for (const name of neighborSet) {
          if (primary.has(name)) continue;
          const pt = byName.get(name);
          if (!pt) continue;
          const halfW = (ctx.measureText(name).width + 10) / 2;
          labelItems.push({
            name,
            ax: pt.px,
            ay: pt.py,
            targetX: pt.px,
            targetY: pt.py + 18,
            halfW,
            halfH: 9,
            color: "#666",
            muted: true,
            primary: false,
          });
        }
      }

      // Sync persistent label state with the live set.
      const live = new Set(labelItems.map((i) => i.name));
      for (const k of Array.from(labelStateRef.current.keys())) {
        if (!live.has(k)) labelStateRef.current.delete(k);
      }
      for (const item of labelItems) {
        if (!labelStateRef.current.has(item.name)) {
          labelStateRef.current.set(item.name, {
            x: item.targetX,
            y: item.targetY,
            vx: 0,
            vy: 0,
          });
        }
      }

      // Relax: spring toward target + pairwise overlap repulsion + damping.
      const ITERS = 6;
      const SPRING_K = 0.18;
      const REPULSE = 0.55;
      const DAMPING = 0.55;

      for (let iter = 0; iter < ITERS; iter++) {
        const fx = new Map<string, number>();
        const fy = new Map<string, number>();
        for (const item of labelItems) {
          fx.set(item.name, 0);
          fy.set(item.name, 0);
        }
        for (const item of labelItems) {
          const s = labelStateRef.current.get(item.name)!;
          fx.set(item.name, fx.get(item.name)! + SPRING_K * (item.targetX - s.x));
          fy.set(item.name, fy.get(item.name)! + SPRING_K * (item.targetY - s.y));
        }
        for (let i = 0; i < labelItems.length; i++) {
          const A = labelItems[i];
          const sA = labelStateRef.current.get(A.name)!;
          for (let j = i + 1; j < labelItems.length; j++) {
            const B = labelItems[j];
            const sB = labelStateRef.current.get(B.name)!;
            const dx = sB.x - sA.x;
            const dy = sB.y - sA.y;
            const overlapX = A.halfW + B.halfW - Math.abs(dx);
            const overlapY = A.halfH + B.halfH - Math.abs(dy);
            if (overlapX > 0 && overlapY > 0) {
              if (overlapX < overlapY) {
                const sign = dx >= 0 ? 1 : -1;
                fx.set(A.name, fx.get(A.name)! - REPULSE * overlapX * sign);
                fx.set(B.name, fx.get(B.name)! + REPULSE * overlapX * sign);
              } else {
                const sign = dy >= 0 ? 1 : -1;
                fy.set(A.name, fy.get(A.name)! - REPULSE * overlapY * sign);
                fy.set(B.name, fy.get(B.name)! + REPULSE * overlapY * sign);
              }
            }
          }
        }
        for (const item of labelItems) {
          const s = labelStateRef.current.get(item.name)!;
          s.vx = (s.vx + fx.get(item.name)!) * DAMPING;
          s.vy = (s.vy + fy.get(item.name)!) * DAMPING;
          s.x += s.vx;
          s.y += s.vy;
          s.x = Math.max(item.halfW, Math.min(W - item.halfW, s.x));
          s.y = Math.max(item.halfH, Math.min(H - item.halfH, s.y));
        }
      }

      // Draw leader lines first (under labels).
      for (const item of labelItems) {
        const s = labelStateRef.current.get(item.name)!;
        const insideX = Math.abs(item.ax - s.x) < item.halfW;
        const insideY = Math.abs(item.ay - s.y) < item.halfH;
        if (insideX && insideY) continue;
        const exit = rectExitPoint(s.x, s.y, item.halfW, item.halfH, item.ax, item.ay);
        ctx.strokeStyle = item.muted
          ? "rgba(120,120,120,0.45)"
          : "rgba(0,0,0,0.35)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(item.ax, item.ay);
        ctx.lineTo(exit.x, exit.y);
        ctx.stroke();
      }

      // Draw labels.
      for (const item of labelItems) {
        const s = labelStateRef.current.get(item.name)!;
        ctx.font = item.primary ? fontPrimaryStr : fontMutedStr;
        drawLabel(
          ctx,
          item.name,
          s.x,
          s.y,
          item.halfW,
          item.halfH,
          item.color,
          item.muted,
        );
      }
    };

    const tick = (ts: number) => {
      const s = stateRef.current;
      if (s.lastTs === 0) s.lastTs = ts;
      const dt = (ts - s.lastTs) / 1000;
      s.lastTs = ts;
      if (s.playing) {
        s.elapsed += dt;
        s.year = yearAtTime(
          s.elapsed,
          s.duration,
          propsRef.current.meta.year_range,
        );
      }
      draw();
      forceTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Find nearest dot to mouse position (canvas-local px).
  const findNearest = (mx: number, my: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const W = parseFloat(canvas.style.width) || 0;
    const H = parseFloat(canvas.style.height) || 0;
    if (W < 1 || H < 1) return null;
    const year = stateRef.current.year;
    let best: { name: string; px: number; py: number; d2: number } | null = null;
    for (const t of propsRef.current.tracks) {
      const p = positionAt(t, year);
      if (!p.visible) continue;
      const px = p.x * W;
      const py = p.y * H;
      const dx = px - mx;
      const dy = py - my;
      const d2 = dx * dx + dy * dy;
      if (!best || d2 < best.d2) best = { name: t.name, px, py, d2 };
    }
    if (!best) return null;
    if (best.d2 > HOVER_RADIUS_PX * HOVER_RADIUS_PX) return null;
    return best;
  };

  const onCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = findNearest(mx, my);
    if (hit) {
      if (hit.name !== hoverName) setHoverName(hit.name);
      setHoverPos({ x: hit.px, y: hit.py });
    } else {
      if (hoverName !== null) setHoverName(null);
      if (hoverPos !== null) setHoverPos(null);
    }
  };

  const onCanvasLeave = () => {
    if (hoverName !== null) setHoverName(null);
    if (hoverPos !== null) setHoverPos(null);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hit = findNearest(e.clientX - rect.left, e.clientY - rect.top);
    if (hit) onToggle(hit.name);
  };

  const togglePlay = () => {
    stateRef.current.playing = !stateRef.current.playing;
    forceTick((n) => n + 1);
  };

  const onScrub = (year: number) => {
    const s = stateRef.current;
    const span = meta.year_range[1] - meta.year_range[0];
    s.elapsed = ((year - meta.year_range[0]) / span) * s.duration;
    s.year = year;
  };

  const toggleFullscreen = () => {
    const el = wrapperRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  };

  const hoverTrack = hoverName ? trackByName.get(hoverName) : null;
  const canvasOffset = (() => {
    const wrap = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return { left: 0, top: 0 };
    const wr = wrap.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    return { left: cr.left - wr.left, top: cr.top - wr.top };
  })();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-gl-border px-4 py-2">
        <button
          onClick={togglePlay}
          className="rounded border border-gl-border px-2 py-1 text-sm hover:bg-gl-bg w-16"
        >
          {stateRef.current.playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={meta.year_range[0]}
          max={meta.year_range[1]}
          step={0.1}
          value={stateRef.current.year}
          onChange={(e) => onScrub(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="font-mono text-sm tabular-nums w-12 text-right">
          {Math.round(stateRef.current.year)}
        </span>
        <label className="flex items-center gap-1 text-xs text-gl-muted">
          <input
            type="checkbox"
            checked={showTrails}
            onChange={(e) => setShowTrails(e.target.checked)}
          />
          Trails
        </label>
        <label className="flex items-center gap-1 text-xs text-gl-muted">
          <input
            type="checkbox"
            checked={showNN}
            onChange={(e) => setShowNN(e.target.checked)}
          />
          {KNN_K} nearest
        </label>
        <button
          onClick={toggleFullscreen}
          className="rounded border border-gl-border px-2 py-1 text-sm hover:bg-gl-bg"
        >
          Fullscreen
        </button>
      </div>
      <div
        ref={wrapperRef}
        className="relative flex flex-1 items-center justify-center p-4 min-h-0"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={onCanvasMove}
          onMouseLeave={onCanvasLeave}
          onClick={onCanvasClick}
          className="rounded shadow-sm cursor-crosshair"
        />
        {hoverName && hoverPos && hoverTrack && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border border-gl-border bg-white px-2 py-1 text-xs shadow"
            style={{
              left: canvasOffset.left + hoverPos.x,
              top: canvasOffset.top + hoverPos.y - 10,
            }}
          >
            <div className="font-semibold">{hoverName}</div>
            <div className="flex items-center gap-1 text-[10px] text-gl-muted">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: meta.regions[hoverTrack.region] ?? "#777" }}
              />
              {hoverTrack.region}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-gl-border px-4 py-2 text-xs text-gl-muted">
        {selected.size > 0 ? (
          <>
            <span className="font-medium text-gl-text">
              {selected.size} selected:
            </span>{" "}
            {Array.from(selected).sort().join(", ")}
          </>
        ) : (
          <>Hover a dot to identify it · click to select · check countries in the sidebar to label them.</>
        )}
      </div>
    </div>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const v = parseInt(m[1], 16);
  const r = (v >> 16) & 0xff;
  const g = (v >> 8) & 0xff;
  const b = v & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  color: string,
  muted: boolean,
) {
  const boxX = cx - halfW;
  const boxY = cy - halfH;
  const boxW = halfW * 2;
  const boxH = halfH * 2;
  ctx.fillStyle = muted ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.95)";
  roundRect(ctx, boxX, boxY, boxW, boxH, 3);
  ctx.fill();
  ctx.strokeStyle = withAlpha(color, muted ? 0.3 : 0.4);
  ctx.lineWidth = 1;
  roundRect(ctx, boxX, boxY, boxW, boxH, 3);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
}

function rectExitPoint(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  fromX: number,
  fromY: number,
): { x: number; y: number } {
  const dx = fromX - cx;
  const dy = fromY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const tx = halfW / Math.max(Math.abs(dx), 1e-9);
  const ty = halfH / Math.max(Math.abs(dy), 1e-9);
  const t = Math.min(tx, ty, 1);
  return { x: cx + dx * t, y: cy + dy * t };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
