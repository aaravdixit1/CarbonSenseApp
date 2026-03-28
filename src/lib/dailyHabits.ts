import { DailyHabit } from '../types/index';

export const DAILY_HABITS: DailyHabit[] = [
  // Transport
  {
    id: 'no_car_today',
    label: 'Left the car at home',
    description: 'Walked, cycled, or used transit instead of driving',
    category: 'transport',
    savings_kg: 3.2,
  },
  {
    id: 'carpooled',
    label: 'Carpooled or shared a ride',
    description: 'Shared a journey with at least one other person',
    category: 'transport',
    savings_kg: 1.6,
  },
  {
    id: 'short_trip_walk',
    label: 'Walked for a short trip',
    description: 'Chose walking over driving for a trip under 2 km',
    category: 'transport',
    savings_kg: 0.8,
  },

  // Food
  {
    id: 'no_meat_today',
    label: 'No meat today',
    description: 'Ate a fully plant-based or vegetarian day',
    category: 'food',
    savings_kg: 2.5,
  },
  {
    id: 'local_meal',
    label: 'Ate a local or seasonal meal',
    description: 'Chose locally sourced or seasonal ingredients',
    category: 'food',
    savings_kg: 0.9,
  },
  {
    id: 'no_food_waste',
    label: 'Zero food waste',
    description: 'Used up leftovers and wasted no food today',
    category: 'food',
    savings_kg: 0.5,
  },

  // Home energy
  {
    id: 'shorter_shower',
    label: 'Took a shorter shower',
    description: 'Kept shower under 5 minutes',
    category: 'home_energy',
    savings_kg: 0.4,
  },
  {
    id: 'lights_off',
    label: 'Turned off unused lights',
    description: 'Switched off lights and standby devices when not in use',
    category: 'home_energy',
    savings_kg: 0.2,
  },
  {
    id: 'lower_thermostat',
    label: 'Lowered the thermostat',
    description: 'Reduced heating or cooling by at least 2°C / 3°F',
    category: 'home_energy',
    savings_kg: 0.6,
  },

  // Shopping
  {
    id: 'no_new_purchase',
    label: 'Bought nothing new',
    description: 'Avoided buying any new goods or clothing today',
    category: 'shopping',
    savings_kg: 1.2,
  },
  {
    id: 'secondhand',
    label: 'Chose secondhand',
    description: 'Bought or used a secondhand item instead of new',
    category: 'shopping',
    savings_kg: 2.0,
  },
];

export const CATEGORY_META: Record<DailyHabit['category'], { label: string; color: string }> = {
  transport: { label: 'Transport', color: '#A2C4D5' },
  food: { label: 'Food', color: '#A8D5A2' },
  home_energy: { label: 'Home Energy', color: '#E8D5A2' },
  shopping: { label: 'Shopping', color: '#D5A2C4' },
};
