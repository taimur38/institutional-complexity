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
