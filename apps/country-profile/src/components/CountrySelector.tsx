import { useMemo, useState } from "react";
import type { Track } from "../types";

type Props = {
  tracks: Track[];
  regions: Record<string, string>;
  selected: Set<string>;
  onToggle: (name: string) => void;
  onClear: () => void;
  focus: string | null;
  onFocus: (name: string | null) => void;
};

export function CountrySelector({
  tracks,
  regions,
  selected,
  onToggle,
  onClear,
  focus,
  onFocus,
}: Props) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? tracks.filter((t) => t.name.toLowerCase().includes(q))
      : tracks;
    const byRegion = new Map<string, Track[]>();
    for (const t of filtered) {
      if (!byRegion.has(t.region)) byRegion.set(t.region, []);
      byRegion.get(t.region)!.push(t);
    }
    return Array.from(byRegion.entries())
      .map(([region, list]) => ({
        region,
        list: list.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.region.localeCompare(b.region));
  }, [tracks, query]);

  return (
    <div className="flex h-[calc(100%-65px)] flex-col">
      <div className="flex items-center gap-2 px-4 py-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="flex-1 rounded border border-gl-border bg-white px-2 py-1 text-sm focus:border-gl-blue focus:outline-none"
        />
        {selected.size > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gl-muted hover:text-gl-text"
          >
            Clear ({selected.size})
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {grouped.map(({ region, list }) => (
          <div key={region} className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: regions[region] ?? "#999" }}
              />
              <span className="text-xs font-medium uppercase tracking-wide text-gl-muted">
                {region}
              </span>
            </div>
            <ul>
              {list.map((t) => {
                const isSelected = selected.has(t.name);
                const isFocus = focus === t.name;
                return (
                  <li key={t.name}>
                    <label
                      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gl-bg ${
                        isFocus ? "bg-gl-bg" : ""
                      }`}
                      onMouseEnter={() => onFocus(t.name)}
                      onMouseLeave={() => onFocus(null)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(t.name)}
                        className="h-3 w-3"
                      />
                      <span className={isSelected ? "font-medium" : ""}>
                        {t.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {grouped.length === 0 && (
          <p className="px-3 py-4 text-sm text-gl-muted">No matches.</p>
        )}
      </div>
    </div>
  );
}
