import { useEffect, useMemo, useState } from "react";
import type {
  Country,
  GrowthRecord,
  RelatedIndicator,
  RelatedIndicatorsMeta,
} from "../types";
import { useRelatedIndicators } from "../lib/useRelatedIndicators";
import { GL, GL_PEER_PALETTE } from "../lib/glTokens";
import { HSComponentChart } from "./charts/HSComponentChart";

type Props = {
  focus: Country;
  peers: { iso3: string; name: string }[];
  growthRecord: GrowthRecord | null;
};

export function RelatedIndicatorsSection({ focus, peers, growthRecord }: Props) {
  const [meta, setMeta] = useState<RelatedIndicatorsMeta | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [showPeers, setShowPeers] = useState(false);

  useEffect(() => {
    fetch("/related_indicators_meta.json")
      .then((r) => r.json() as Promise<RelatedIndicatorsMeta>)
      .then((m) => {
        setMeta(m);
        setTag((prev) => prev ?? m.default);
      });
  }, []);

  const isos = useMemo(
    () =>
      showPeers ? [focus.iso3, ...peers.map((p) => p.iso3)] : [focus.iso3],
    [focus.iso3, peers, showPeers],
  );
  const records = useRelatedIndicators(isos);
  const focusRecord = records[focus.iso3];
  const peerSeries = showPeers
    ? peers.map((p) => ({ iso3: p.iso3, name: p.name, record: records[p.iso3] }))
    : [];

  // Group indicators for the optgroup-rendered select.
  const grouped = useMemo(() => {
    if (!meta) return [];
    const byGroup = new Map<string, RelatedIndicator[]>();
    for (const i of meta.indicators) {
      const arr = byGroup.get(i.group) ?? [];
      arr.push(i);
      byGroup.set(i.group, arr);
    }
    // Preserve the order declared in meta.groups; fall back to insertion order.
    const ordered = meta.groups.filter((g) => byGroup.has(g));
    for (const g of byGroup.keys()) if (!ordered.includes(g)) ordered.push(g);
    return ordered.map((g) => ({ group: g, items: byGroup.get(g)! }));
  }, [meta]);

  if (!meta) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-semibold">Explore related indicators</h2>
        <p className="mt-2 text-sm text-gl-muted">Loading…</p>
      </section>
    );
  }

  const selected: RelatedIndicator =
    meta.indicators.find((i) => i.tag === tag) ??
    meta.indicators.find((i) => i.tag === meta.default) ??
    meta.indicators[0];

  const isInverse = selected.direction === "negative";
  const breakYears = growthRecord?.breaks?.years;

  return (
    <section className="mt-12 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Explore related indicators</h2>
          <p className="mt-1 text-sm text-gl-muted">
            Governance and quality-of-government indicators that Hanson &amp;
            Sigman used for convergent-validity checks (their Table 3) plus a
            few adjacent series. Drawn from macro_df where available — most
            run through 2022–2023 — and from the H&amp;S replication archive
            (frozen at 2015) for the five indicators not in macro_df.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={showPeers}
            onChange={(e) => setShowPeers(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          <span>Overlay peers</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded border border-gl-border bg-white px-3 py-2 text-xs">
        <label className="flex items-center gap-2">
          <span className="text-gl-muted">Indicator</span>
          <select
            value={selected.tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded border border-gl-border bg-white px-2 py-1 text-xs"
          >
            {grouped.map(({ group, items }) => (
              <optgroup key={group} label={group}>
                {items.map((i) => (
                  <option key={i.tag} value={i.tag}>
                    {i.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <span className="font-mono text-[10px] text-gl-muted">
          {selected.tag}
        </span>
      </div>

      <div className="rounded border border-gl-border bg-white px-3 py-2 text-xs leading-relaxed">
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="font-medium text-gl-text">{selected.label}</span>
          {isInverse && (
            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Inverse signal
            </span>
          )}
        </div>
        <p className="text-gl-text">
          <span className="text-gl-muted">Data dictionary:</span>{" "}
          <em>{selected.dict_label}</em>
        </p>
        <p className="mt-1 text-gl-muted">{selected.description}</p>
        <p className="mt-1 text-[11px] text-gl-muted">
          Source: {selected.source}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border border-gl-border bg-white px-3 py-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-0.5 w-5"
            style={{ background: GL.blue }}
          />
          <span className="font-medium">{focus.name}</span>
        </span>
        {showPeers &&
          peers.map((p, i) => (
            <span key={p.iso3} className="flex items-center gap-1.5">
              <span
                className="inline-block h-0.5 w-5 opacity-60"
                style={{
                  background: GL_PEER_PALETTE[i % GL_PEER_PALETTE.length],
                }}
              />
              <span className="text-gl-muted">{p.name}</span>
            </span>
          ))}
        {!showPeers && (
          <span className="text-gl-muted">
            Toggle "Overlay peers" to compare across {peers.length} peers.
          </span>
        )}
      </div>

      <HSComponentChart
        tag={selected.tag}
        focus={{ iso3: focus.iso3, name: focus.name, record: focusRecord }}
        peers={peerSeries}
        breakYears={breakYears}
      />
    </section>
  );
}
