/**
 * Unit tests for IntakeContext — getVisibleSteps and reducer logic
 * Feature: carbonsense-react-native
 */

import { getVisibleSteps } from '../src/components/intake/IntakeContext';
import { HabitProfile } from '../src/types/index';

describe('getVisibleSteps', () => {
  it('returns 7 steps when transport_method is not set (safe default)', () => {
    const steps = getVisibleSteps({});
    expect(steps).toHaveLength(7);
    expect(steps).not.toContain('car_type');
  });

  it('returns 8 steps when transport_method is car', () => {
    const steps = getVisibleSteps({ transport_method: 'car' });
    expect(steps).toHaveLength(8);
    expect(steps[1]).toBe('car_type');
  });

  it('returns 7 steps when transport_method is transit', () => {
    const steps = getVisibleSteps({ transport_method: 'transit' });
    expect(steps).toHaveLength(7);
    expect(steps).not.toContain('car_type');
  });

  it('returns 7 steps when transport_method is cycling', () => {
    const steps = getVisibleSteps({ transport_method: 'cycling' });
    expect(steps).toHaveLength(7);
    expect(steps).not.toContain('car_type');
  });

  it('returns 7 steps when transport_method is walking', () => {
    const steps = getVisibleSteps({ transport_method: 'walking' });
    expect(steps).toHaveLength(7);
    expect(steps).not.toContain('car_type');
  });

  it('is idempotent — two calls with same answers return equal arrays', () => {
    const answers: Partial<HabitProfile> = { transport_method: 'car' };
    const first = getVisibleSteps(answers);
    const second = getVisibleSteps(answers);
    expect(first).toEqual(second);
  });

  it('car_type is at index 1 for car users', () => {
    const steps = getVisibleSteps({ transport_method: 'car' });
    expect(steps.indexOf('car_type')).toBe(1);
  });

  it('always starts with transport_method', () => {
    expect(getVisibleSteps({})[0]).toBe('transport_method');
    expect(getVisibleSteps({ transport_method: 'car' })[0]).toBe('transport_method');
  });
});
