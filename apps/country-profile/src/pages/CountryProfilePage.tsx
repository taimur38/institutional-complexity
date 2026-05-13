import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Country, GrowthIndex, PeersIndex } from "../types";
import { CountryPicker } from "../components/CountryPicker";
import { PeerSection } from "../components/PeerSection";
import { PeerAnomaliesSection } from "../components/PeerAnomaliesSection";
import { GrowthBreaksSection } from "../components/GrowthBreaksSection";
import { VDemSection } from "../components/VDemSection";
import { VDemExplorer } from "../components/VDemExplorer";
import { BdmSection } from "../components/BdmSection";
import { StateCapacitySection } from "../components/StateCapacitySection";
import { PCTrajectoriesSection } from "../components/PCTrajectoriesSection";

const DEFAULT_ISO = "PAK";
const DEFAULT_N_PEERS = 5;

export function CountryProfilePage() {
  const { iso } = useParams<{ iso?: string }>();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<Country[] | null>(null);
  const [peers, setPeers] = useState<PeersIndex | null>(null);
  const [growth, setGrowth] = useState<GrowthIndex | null>(null);
  const [peerIsos, setPeerIsos] = useState<string[]>([]);

  // Load reference data once.
  useEffect(() => {
    Promise.all([
      fetch("/countries.json").then((r) => r.json() as Promise<Country[]>),
      fetch("/peers_2025.json").then((r) => r.json() as Promise<PeersIndex>),
      fetch("/growth_series.json").then((r) => r.json() as Promise<GrowthIndex>),
    ]).then(([c, p, g]) => {
      setCountries(c);
      setPeers(p);
      setGrowth(g);
    });
  }, []);

  // Normalize the URL — redirect "" → /country/PAK, lowercase → uppercase.
  useEffect(() => {
    if (!iso) {
      navigate(`/country/${DEFAULT_ISO}`, { replace: true });
      return;
    }
    if (iso !== iso.toUpperCase()) {
      navigate(`/country/${iso.toUpperCase()}`, { replace: true });
    }
  }, [iso, navigate]);

  const focusIso = (iso ?? DEFAULT_ISO).toUpperCase();
  const focus = useMemo(
    () => countries?.find((c) => c.iso3 === focusIso) ?? null,
    [countries, focusIso],
  );

  // Whenever the focus country changes, reset the peer set to its top-N.
  useEffect(() => {
    if (!peers || !focus) return;
    const top = (peers[focus.iso3] ?? []).slice(0, DEFAULT_N_PEERS);
    setPeerIsos(top.map((p) => p.iso3));
  }, [peers, focus]);

  const peerList = useMemo(() => {
    if (!countries) return [];
    return peerIsos
      .map((i) => countries.find((c) => c.iso3 === i))
      .filter((c): c is Country => !!c)
      .map((c) => ({ iso3: c.iso3, name: c.name }));
  }, [peerIsos, countries]);

  if (!countries || !peers || !growth) {
    return (
      <div className="flex h-full items-center justify-center text-gl-muted">
        Loading…
      </div>
    );
  }

  if (!focus) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm text-gl-muted">
          Unknown country code <span className="font-mono">{focusIso}</span>.
        </p>
        <button
          onClick={() => navigate(`/country/${DEFAULT_ISO}`)}
          className="mt-3 text-sm text-gl-blue hover:underline"
        >
          Go to {DEFAULT_ISO}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gl-muted">
            Country profile
          </p>
          <h1 className="mt-1 text-3xl font-semibold">{focus.name}</h1>
          <p className="mt-0.5 text-sm text-gl-muted">
            {focus.region} · <span className="font-mono">{focus.iso3}</span>
          </p>
        </div>
        <div className="w-72">
          <CountryPicker
            countries={countries}
            value={focus.iso3}
            onChange={(next) => navigate(`/country/${next}`)}
          />
        </div>
      </div>

      <PeerSection
        focus={focus}
        countries={countries}
        peers={peers}
        peerIsos={peerIsos}
        onChange={setPeerIsos}
      />

      <PeerAnomaliesSection
        focus={focus}
        countries={countries}
        peerIsos={peerIsos}
      />

      <GrowthBreaksSection record={growth[focus.iso3] ?? null} />

      <VDemSection
        focus={focus}
        peers={peerList}
        growthRecord={growth[focus.iso3] ?? null}
      />

      <VDemExplorer
        focus={focus}
        peers={peerList}
        growthRecord={growth[focus.iso3] ?? null}
      />

      <BdmSection
        focus={focus}
        peers={peerList}
        growthRecord={growth[focus.iso3] ?? null}
      />

      <StateCapacitySection
        focus={focus}
        peers={peerList}
        growthRecord={growth[focus.iso3] ?? null}
      />

      <PCTrajectoriesSection
        focus={focus}
        peers={peerList}
        growthRecord={growth[focus.iso3] ?? null}
      />
    </div>
  );
}
