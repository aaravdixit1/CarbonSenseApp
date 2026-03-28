/**
 * Unit tests for storage.ts — serializeSession / deserializeSession
 * Feature: carbonsense-react-native
 */

import { serializeSession, deserializeSession } from '../src/lib/storage';
import { StoredSession, SCHEMA_VERSION } from '../src/types/index';

const validSession: StoredSession = {
  schema_version: SCHEMA_VERSION,
  session_id: 'test-123',
  habit_profile: {
    transport_method: 'car',
    car_type: 'gasoline',
    diet_type: 'omnivore',
    meat_frequency: 'daily',
    home_energy_source: 'grid',
    household_size: 2,
    shopping_frequency: 'weekly',
    flight_frequency: 'one_or_two',
  },
  footprint_result: {
    total_tco2e: 5.4,
    breakdown: [
      { category: 'food', absolute_tco2e: 1.2, percentage: 22, substituted: false },
    ],
    db_version: 'v1',
    factors_used: { food: 0.5 },
  },
  actions: [
    {
      id: 'a1',
      description: 'Eat less meat',
      savings_tco2e: 0.5,
      impact_label: 'High',
      rank: 1,
      composite_score: 0.9,
    },
  ],
  created_at: '2024-01-01T00:00:00.000Z',
};

describe('serializeSession', () => {
  it('produces valid JSON', () => {
    const result = serializeSession(validSession);
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('includes all top-level fields', () => {
    const result = JSON.parse(serializeSession(validSession));
    expect(result.schema_version).toBe(SCHEMA_VERSION);
    expect(result.session_id).toBe('test-123');
    expect(result.habit_profile).toBeDefined();
    expect(result.footprint_result).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.created_at).toBeDefined();
  });
});

describe('deserializeSession', () => {
  it('round-trips a valid session', () => {
    const serialized = serializeSession(validSession);
    const result = deserializeSession(serialized);
    expect(result).toEqual(validSession);
  });

  it('throws SyntaxError on invalid JSON', () => {
    expect(() => deserializeSession('not-json')).toThrow(SyntaxError);
  });

  it('throws on empty string', () => {
    expect(() => deserializeSession('')).toThrow();
  });

  it('throws when schema_version is missing', () => {
    const noVersion = JSON.stringify({ session_id: 'x', habit_profile: {} });
    expect(() => deserializeSession(noVersion)).toThrow(/schema_version/i);
  });

  it('throws when schema_version is wrong', () => {
    const wrongVersion = JSON.stringify({ ...validSession, schema_version: '2.0' });
    expect(() => deserializeSession(wrongVersion)).toThrow(/schema_version/i);
  });

  it('preserves nested objects through round-trip', () => {
    const result = deserializeSession(serializeSession(validSession));
    expect(result.footprint_result.breakdown[0].category).toBe('food');
    expect(result.actions[0].rank).toBe(1);
  });
});
