// ── Constants ────────────────────────────────────────────────────────────────

export const SCHEMA_VERSION = '1.0';
export const STORAGE_KEY = 'carbonsense_session';
export const DAILY_LOG_KEY = 'carbonsense_daily_logs';
export const MAX_SCALE = 10;      // tCO₂e — upper bound of FootprintMeter bar
export const PARIS_TARGET = 2.3;  // tCO₂e/year
export const GLOBAL_AVG = 4.7;    // tCO₂e/year

export const STEP_KEYS: (keyof HabitProfile)[] = [
  'transport_method',
  'car_type',
  'weekly_km',
  'fuel_economy',
  'diet_type',
  'meat_frequency',
  'local_food_pct',
  'home_energy_source',
  'household_size',
  'trash_vs_neighbors',
  'shopping_frequency',
  'flight_frequency',
];

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface HabitProfile {
  transport_method: 'car' | 'transit' | 'cycling' | 'walking';
  car_type?: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | null;
  weekly_km: number;        // 0–500+
  fuel_economy: number;     // 0–100 (0 = inefficient, 100 = efficient/electric)
  diet_type: 'omnivore' | 'flexitarian' | 'vegetarian' | 'vegan';
  meat_frequency: 'daily' | 'few_per_week' | 'weekly' | 'rarely';
  local_food_pct: number;   // 0–100
  home_energy_source: 'grid' | 'natural_gas' | 'renewables' | 'mixed';
  household_size: number;   // 1–10
  trash_vs_neighbors: number; // 0–100 (0 = much less, 100 = much more)
  shopping_frequency: 'rarely' | 'monthly' | 'weekly' | 'daily';
  flight_frequency: 'none' | 'one_or_two' | 'several' | 'frequent';
}

export interface CategoryBreakdown {
  category: 'food' | 'transport' | 'home_energy' | 'shopping';
  absolute_tco2e: number;
  percentage: number;
  substituted: boolean;
}

export interface FootprintResult {
  total_tco2e: number;
  breakdown: CategoryBreakdown[];
  db_version: string;
  factors_used: Record<string, number>;
}

export interface Action {
  id: string;
  description: string;
  savings_tco2e: number;
  impact_label: string;
  rank: number; // 1–3
  composite_score: number;
}

export interface AnalyzeResponse {
  footprint: FootprintResult;
  actions: Action[];
  session_id: string;
  fallback_used: boolean;
}

export interface StoredSession {
  schema_version: string; // must equal SCHEMA_VERSION = "1.0"
  session_id: string;
  habit_profile: HabitProfile;
  footprint_result: FootprintResult;
  actions: Action[];
  created_at: string; // ISO 8601
}

// ── Daily Tracking ────────────────────────────────────────────────────────────

export interface DailyHabit {
  id: string;
  label: string;
  description: string;
  category: 'transport' | 'food' | 'home_energy' | 'shopping';
  /** estimated kg CO₂e saved vs baseline when checked */
  savings_kg: number;
}

export interface DailyLog {
  date: string;           // YYYY-MM-DD
  completed_habit_ids: string[];
  note?: string;
}
