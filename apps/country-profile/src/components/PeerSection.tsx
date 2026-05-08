import { useMemo, useState } from "react";
import type { Country, PeersIndex } from "../types";
import { CountryPicker } from "./CountryPicker";

type Props = {
  focus: Country;                     // the country whose profile this is
  countries: Country[];
  peers: PeersIndex;
  // Currently visible peer set (ISO3s in display order). Lifted to parent so
  // other sections (later) can read it.
  peerIsos: string[];
  onChange: (peerIsos: string[]) => void;
};

const DEFAULT_N = 5;

export function PeerSection({ focus, countries, peers, peerIsos, onChange }: Props) {
  const [adding, setAdding] = useState(false);

  const focusPeers = peers[focus.iso3] ?? [];

  // Look up display info for an ISO. The peer ranking has distance only when
  // the peer is in the focus country's top-K; otherwise we just show name.
  const distanceByIso = useMemo(() => {
    const m = new Map<string, number>();
    focusPeers.forEach((p) => m.set(p.iso3, p.distance));
    return m;
  }, [focusPeers]);

  const countryByIso = useMemo(() => {
    const m = new Map<string, Country>();
    countries.forEach((c) => m.set(c.iso3, c));
    return m;
  }, [countries]);

  const remove = (iso3: string) => onChange(peerIsos.filter((i) => i !== iso3));
  const add = (iso3: string) => {
    if (peerIsos.includes(iso3) || iso3 === focus.iso3) return;
    onChange([...peerIsos, iso3]);
    setAdding(false);
  };

  const showMore = () => {
    // Append the next-closest peer not already shown.
    const next = focusPeers.find(
      (p) => !peerIsos.includes(p.iso3) && p.iso3 !== focus.iso3,
    );
    if (next) onChange([...peerIsos, next.iso3]);
  };

  const reset = () =>
    onChange(focusPeers.slice(0, DEFAULT_N).map((p) => p.iso3));

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-semibold">Institutional peers</h2>
          <p className="mt-0.5 text-xs text-gl-muted">
            Closest countries by Euclidean distance on z-scored V-Dem indicators
            (2025 cross-section).
          </p>
        </div>
        <button
          onClick={reset}
          className="text-xs text-gl-muted hover:text-gl-text"
        >
          Reset
        </button>
      </div>

      <ul className="divide-y divide-gl-border rounded border border-gl-border bg-white">
        {peerIsos.map((iso, idx) => {
          const c = countryByIso.get(iso);
          if (!c) return null;
          const d = distanceByIso.get(iso);
          return (
            <li
              key={iso}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 text-right font-mono text-xs text-gl-muted">
                  {idx + 1}
                </span>
                <span className="font-medium">{c.name}</span>
                <span className="font-mono text-xs text-gl-muted">{c.iso3}</span>
                <span className="text-xs text-gl-muted">{c.region}</span>
              </div>
              <div className="flex items-center gap-3">
                {d !== undefined && (
                  <span className="font-mono text-xs text-gl-muted">
                    d = {d.toFixed(2)}
                  </span>
                )}
                <button
                  onClick={() => remove(iso)}
                  className="text-xs text-gl-muted hover:text-gl-highlight"
                  aria-label={`Remove ${c.name}`}
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-3">
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="rounded border border-gl-border bg-white px-2.5 py-1 text-xs hover:border-gl-blue"
          >
            + Add country
          </button>
        ) : (
          <div className="w-72">
            <CountryPicker
              countries={countries}
              value={null}
              exclude={[focus.iso3, ...peerIsos]}
              placeholder="Search to add…"
              onChange={add}
            />
          </div>
        )}
        {focusPeers.length > peerIsos.length && (
          <button
            onClick={showMore}
            className="text-xs text-gl-muted hover:text-gl-text"
          >
            + Show next closest
          </button>
        )}
      </div>
    </section>
  );
}
