import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY, DAILY_LOG_KEY, SCHEMA_VERSION } from '../types/index';
import type { StoredSession, DailyLog } from '../types/index';

const MOCK_SESSION: StoredSession = {
  schema_version: SCHEMA_VERSION,
  session_id: 'mock-session-001',
  habit_profile: {
    transport_method: 'car',
    car_type: 'gasoline',
    weekly_km: 150,
    fuel_economy: 40,
    diet_type: 'omnivore',
    meat_frequency: 'few_per_week',
    local_food_pct: 20,
    home_energy_source: 'grid',
    household_size: 3,
    trash_vs_neighbors: 50,
    shopping_frequency: 'monthly',
    flight_frequency: 'one_or_two',
  },
  footprint_result: {
    total_tco2e: 6.8,
    breakdown: [
      { category: 'food', absolute_tco2e: 2.1, percentage: 30.9, substituted: false },
      { category: 'transport', absolute_tco2e: 2.4, percentage: 35.3, substituted: false },
      { category: 'home_energy', absolute_tco2e: 1.5, percentage: 22.1, substituted: false },
      { category: 'shopping', absolute_tco2e: 0.8, percentage: 11.7, substituted: false },
    ],
    db_version: '1.0',
    factors_used: {},
  },
  actions: [
    {
      id: 'action_1',
      description: 'Switch to a plant-rich diet by replacing beef with plant-based proteins at least 3 days per week.',
      savings_tco2e: 0.8,
      impact_label: 'your biggest lever',
      rank: 1,
      composite_score: 0.92,
    },
    {
      id: 'action_2',
      description: 'Replace one short-haul flight per year with train or video-conference alternatives.',
      savings_tco2e: 0.6,
      impact_label: 'high impact',
      rank: 2,
      composite_score: 0.78,
    },
    {
      id: 'action_3',
      description: 'Switch your home energy tariff to a certified renewable electricity provider.',
      savings_tco2e: 0.5,
      impact_label: 'high impact',
      rank: 3,
      composite_score: 0.71,
    },
  ],
  created_at: new Date().toISOString(),
};

// Past 3 days of mock habit logs for a realistic streak
function buildMockLogs(): DailyLog[] {
  const logs: DailyLog[] = [];
  const today = new Date();
  const pastDays = [
    { offset: 2, ids: ['no_meat_today', 'lights_off', 'no_food_waste'] },
    { offset: 1, ids: ['carpooled', 'local_meal', 'shorter_shower', 'no_new_purchase'] },
    { offset: 0, ids: ['no_car_today', 'no_meat_today'] },
  ];
  for (const { offset, ids } of pastDays) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    logs.push({ date: d.toISOString().split('T')[0], completed_habit_ids: ids });
  }
  return logs;
}

/**
 * Seeds AsyncStorage with a completed mock session and habit logs.
 * Safe to call on every launch — only writes if no session exists yet.
 */
export async function seedMockDataIfNeeded(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (existing) return; // already has real or mock data
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SESSION));
    await AsyncStorage.setItem(DAILY_LOG_KEY, JSON.stringify(buildMockLogs()));
  } catch {
    // silently swallow
  }
}

/**
 * Force-resets to mock data regardless of existing state.
 * Useful for dev/testing.
 */
export async function resetToMockData(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_SESSION));
    await AsyncStorage.setItem(DAILY_LOG_KEY, JSON.stringify(buildMockLogs()));
  } catch {
    // silently swallow
  }
}
