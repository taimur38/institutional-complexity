import { useEffect, useMemo, useState } from "react";
import type { Meta, Track } from "./types";
import { CountrySelector } from "./components/CountrySelector";
import { TrajectoryCanvas } from "./components/TrajectoryCanvas";

export function App() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusCountry, setFocusCountry] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/tracks.json").then((r) => r.json() as Promise<Track[]>),
      fetch("/meta.json").then((r) => r.json() as Promise<Meta>),
    ]).then(([t, m]) => {
      setTracks(t);
      setMeta(m);
    });
  }, []);

  const trackByName = useMemo(() => {
    const m = new Map<string, Track>();
    tracks?.forEach((t) => m.set(t.name, t));
    return m;
  }, [tracks]);

  const toggleCountry = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!tracks || !meta) {
    return (
      <div className="flex h-full items-center justify-center text-gl-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <aside className="w-72 shrink-0 border-r border-gl-border bg-white">
        <div className="border-b border-gl-border px-4 py-3">
          <h1 className="text-base font-semibold">Country Profile</h1>
          <p className="mt-1 text-xs text-gl-muted">
            Institutional complexity, 1975–2025
          </p>
        </div>
        <CountrySelector
          tracks={tracks}
          regions={meta.regions}
          selected={selected}
          onToggle={toggleCountry}
          onClear={() => setSelected(new Set())}
          focus={focusCountry}
          onFocus={setFocusCountry}
        />
      </aside>
      <main className="flex-1 min-w-0">
        <TrajectoryCanvas
          tracks={tracks}
          meta={meta}
          selected={selected}
          onToggle={toggleCountry}
          focusCountry={focusCountry}
          trackByName={trackByName}
        />
      </main>
    </div>
  );
}
