// Country-space (animated UMAP) types
export type Observation = { year: number; x: number; y: number };

export type Track = {
  name: string;
  region: string;
  observations: Observation[];
};

export type Meta = {
  year_range: [number, number];
  observation_years: number[];
  default_duration_seconds: number;
  default_fps: number;
  easing: string;
  regions: Record<string, string>;
  source: string;
  notes: string;
};

// Country profile types
export type Country = {
  iso3: string;
  name: string;
  region: string;
};

export type PeerEntry = {
  iso3: string;
  name: string;
  distance: number;
};

// Per-country list of nearest peers (top-K) keyed by ISO3.
export type PeersIndex = Record<string, PeerEntry[]>;

// Growth series (per ISO3, loaded from growth_series.json)
export type ScalarPoint = { year: number; value: number };
export type SectoralPoint = { year: number; agr?: number; ind?: number; srv?: number };

export type BreakPeriod = {
  start: number;
  end: number;
  avg_growth: number;
  median_growth: number;
  passes_kar: boolean | null;
};

export type GrowthRecord = {
  iso3: string;
  breaks: { years: number[]; periods: BreakPeriod[] } | null;
  gdp_per_capita: ScalarPoint[];
  growth_rate: ScalarPoint[];
  sectoral_va: SectoralPoint[];
  sectoral_productivity: SectoralPoint[];
  eci: ScalarPoint[];
};

export type GrowthIndex = Record<string, GrowthRecord>;

// V-Dem indices
export type VDemMetaIndex = {
  tag: string;
  label: string;
  group: string;
  question?: string | null;
  description?: string | null;
};
export type VDemMeta = {
  start_year: number;
  groups: string[];
  indices: VDemMetaIndex[];
};
export type VDemRecord = { iso3: string } & Record<string, ScalarPoint[]>;

// V-Dem explorer (full catalog) — registry shipped as JSON; series shipped
// as one long-format parquet read in-browser with hyparquet.
export type VDemIndicator = {
  tag: string;
  name: string;
  category: string;
  vartype: string;
  question?: string | null;
  description?: string | null;
  responses?: string | null;
  scale?: string | null;
};

export type VDemIndicatorRegistry = {
  start_year: number;
  categories: string[];
  indicators: VDemIndicator[];
};

// BdM winning-coalition (W) series — one ScalarPoint[] per ISO3.
export type BdmIndex = Record<string, ScalarPoint[]>;
