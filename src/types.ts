// Tipos del contrato de datos (specs/001-forecast-results-dashboard/contracts/export-schema.md).
// Todo campo que puede ser null en el contrato se tipa `number | null`.

export type Scenario = 'A' | 'B';
export type Cell = 'AX' | 'AY' | 'AZ';
export type SegmentKey = Cell | 'total';

export interface SourceRecord {
  name: string;
  path: string;
  saved_at?: string | null;
  frozen_at?: string | null;
  sha256?: string;
  manifest_sha256?: string;
  check: string;
  max_day?: number;
}

export interface Headline {
  saving_excess95: number;
  saving_excess95_pct: number;
  recovered_sales_same_excess: number;
  recovered0_pct: number;
}

export interface Meta {
  exported_at: string;
  exporter_version: string;
  sources: SourceRecord[];
  versions: Record<string, string>;
  last_day: number;
  blocks: { block: number; start_date: string }[];
  period: { start: string; end: string };
  test: { n_blocks: number; typical_range: [number, number] };
  wrmsse_units: { one_step: number; chained: number; seasonal_naive: number };
  service: { target: number; z_values: number[] };
  total_demand_test: number;
  headline: Record<Scenario, Headline>;
  checks: { name: string; passed: boolean; detail?: string }[];
  pending: { name: string; reason: string }[];
}

export interface FunnelStage {
  key: 'series' | 'items' | 'segment_a' | 'forecasted';
  label: string;
  count: number;
  by_cell?: Record<Cell, number>;
}

export interface Funnel {
  stages: FunnelStage[];
  money_at_stake: { train_spend_share_517: number; test_demand_517: number };
}

export interface ErrorMetric {
  wrmsse: number | null;
  wape: number | null;
}

export interface SegmentImpact {
  demand: number;
  impact_lost: number;
  impact_excess: number;
  impact: number;
  impact_pct_demand: number;
}

export interface Reading {
  z95_model: number;
  z95_naive: number;
  excess95_model: number;
  excess95_naive: number;
  saving_excess95: number;
  saving_excess95_pct: number;
  recovered_sales_same_excess: number;
  lost0_model: number;
  lost0_naive: number;
  excess0_model: number;
  excess0_naive: number;
  recovered0_pct: number;
  recovered95_pct: number;
}

export interface CurvePoint {
  z: number;
  demand: number;
  captured: number;
  lost: number;
  excess: number;
  short_blocks: number;
  service: number;
}

export interface SegmentData {
  n_items: number;
  spend_train: number;
  spend_share: number;
  cv_train: number[];
  error: { one_step: ErrorMetric; chained: ErrorMetric; seasonal_naive: ErrorMetric };
  impact: Record<Scenario, SegmentImpact>;
  reading: Record<Scenario, Reading>;
  curves: { A: CurvePoint[]; B: CurvePoint[]; naive: CurvePoint[]; perfect: CurvePoint[] };
  ab: {
    excess95_A: number;
    excess95_B: number;
    excess95_extra_B: number;
    mismatch0_A: number;
    mismatch0_B: number;
    mismatch0_extra_B: number;
  };
}

export interface Concentration {
  items: number;
  improve: number;
  worsen: number;
  for_50pct: number;
  for_80pct: number;
  impact_total: number;
}

export interface Segments {
  segments: Record<SegmentKey, SegmentData>;
  concentration: Record<Scenario, Concentration>;
}

export interface ItemMetrics {
  rmsse_units: number | null;
  wape_units: number | null;
  mae_units: number | null;
  review: boolean;
}

export interface ItemImpact {
  demand: number;
  lost_model: number;
  excess_model: number;
  lost_naive: number;
  excess_naive: number;
  impact_lost: number;
  impact_excess: number;
  impact: number;
  impact_pct_demand: number;
  z_model: number;
  z_naive: number;
}

export interface Item {
  item_id: string;
  cell: Cell;
  treatment: string;
  spend_train: number;
  spend_share: number;
  cv_train: number | null;
  test_blocks: [number, number];
  first_block: number;
  metrics: Record<Scenario, ItemMetrics>;
  impact: Record<Scenario, ItemImpact>;
}

export interface Items {
  items: Item[];
}

export interface SeriesRow {
  block: number;
  units_observed: number | null;
  money_observed: number | null;
  units_completed: number | null;
  ratio_completed: number | null;
  step: number | null;
  forecast: Record<Scenario, number | null> | null;
  baseline: number | null;
}

export interface ItemSeries {
  item_id: string;
  rows: SeriesRow[];
}

// --- Iteración 2 (contracts/export-schema.md §Iteración 2) ---

export interface CatalogItem {
  item_id: string;
  dept: string;
  cell: string | null;
  abc_class: string | null;
  xyz_class: string | null;
  forecasted: boolean;
  first_block: number;
}

export interface Catalog {
  items: CatalogItem[];
}

export interface MatrixCell {
  abc_class: string;
  xyz_class: string;
  cell: string;
  n_items: number;
  spend: number;
}

export interface Segmentation {
  matrix: MatrixCell[];
  total_items: number;
  excluded_no_xyz: number;
  radar: {
    axes: string[];
    global_median: Record<string, number>;
    cells: Record<string, Record<string, { median_raw: number; median_norm: number }>>;
  };
}

export interface DescriptiveRow {
  block: number;
  units_observed: number;
  money_observed: number;
}

export interface Descriptive {
  item_id: string;
  first_block: number;
  rows: DescriptiveRow[];
  stats: {
    n_blocks: number;
    mean: number;
    sigma: number | null;
    band_upper: number | null;
    band_lower: number | null;
    cv_pct: number | null;
  };
  histogram: { from: number; to: number; count: number }[];
}
