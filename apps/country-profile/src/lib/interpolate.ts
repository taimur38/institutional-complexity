import type { Observation, Track } from "../types";

export function easeCubicInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export type InterpResult = { x: number; y: number; visible: boolean };

export function positionAt(track: Track, year: number): InterpResult {
  const obs = track.observations;
  if (obs.length === 0) return { x: 0, y: 0, visible: false };
  if (year <= obs[0].year) return { x: obs[0].x, y: obs[0].y, visible: true };
  const last = obs[obs.length - 1];
  if (year >= last.year) return { x: last.x, y: last.y, visible: true };

  let i = 0;
  while (i < obs.length - 1 && obs[i + 1].year < year) i++;
  const a = obs[i];
  const b = obs[i + 1];
  const t = (year - a.year) / (b.year - a.year);
  const e = easeCubicInOut(t);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, visible: true };
}

export function yearAtTime(
  elapsed: number,
  duration: number,
  yearRange: [number, number],
): number {
  const t = ((elapsed % duration) + duration) % duration;
  return yearRange[0] + (t / duration) * (yearRange[1] - yearRange[0]);
}

export function trackPath(
  track: Track,
  fromYear: number,
  toYear: number,
  steps = 60,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const y = fromYear + ((toYear - fromYear) * i) / steps;
    const p = positionAt(track, y);
    if (p.visible) pts.push({ x: p.x, y: p.y });
  }
  return pts;
}

export function nearestObservation(track: Track, year: number): Observation {
  let best = track.observations[0];
  let bestDist = Math.abs(best.year - year);
  for (const o of track.observations) {
    const d = Math.abs(o.year - year);
    if (d < bestDist) {
      best = o;
      bestDist = d;
    }
  }
  return best;
}
