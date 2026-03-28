import { useReducer, createContext, useContext, FC, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { HabitProfile, STEP_KEYS, SCHEMA_VERSION } from '../../types/index';
import { saveSession } from '../../lib/storage';
import { StoredSession } from '../../types/index';

// ── Types ─────────────────────────────────────────────────────────────────────

type IntakeAction =
  | { type: 'SET_ANSWER'; key: keyof HabitProfile; value: unknown }
  | { type: 'ADVANCE' }
  | { type: 'BACK' }
  | { type: 'RESET' };

interface IntakeState {
  answers: Partial<HabitProfile>;
  currentStep: number;
}

interface IntakeContextValue {
  answers: Partial<HabitProfile>;
  currentStep: number;
  totalSteps: number;
  setAnswer: (key: keyof HabitProfile, value: unknown) => void;
  advance: () => void;
  back: () => void;
  complete: () => Promise<void>;
}

import { QUESTIONS } from './QuestionCard';

// Default values for slider questions when user skips without touching
const SLIDER_DEFAULTS: Partial<Record<keyof HabitProfile, number>> = {
  local_food_pct: 0,
  weekly_km: 0,
  fuel_economy: 50,
  trash_vs_neighbors: 50,
  household_size: 1,
};

/**
 * Returns the filtered list of visible step keys.
 * Omits 'car_type' when transport_method is not 'car'.
 * Pure function — no side effects, exported for testing.
 */
export function getVisibleSteps(answers: Partial<HabitProfile>): (keyof HabitProfile)[] {
  return STEP_KEYS.filter(
    (key) => !['car_type', 'weekly_km', 'fuel_economy'].includes(key) || answers.transport_method === 'car'
  );
}

// ── Reducer ───────────────────────────────────────────────────────────────────

const initialState: IntakeState = {
  answers: {},
  currentStep: 0,
};

function intakeReducer(state: IntakeState, action: IntakeAction): IntakeState {
  switch (action.type) {
    case 'SET_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value },
      };
    case 'ADVANCE': {
      const totalSteps = getVisibleSteps(state.answers).length;
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, totalSteps - 1),
      };
    }
    case 'BACK':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const IntakeContext = createContext<IntakeContextValue | undefined>(undefined);

export function useIntake(): IntakeContextValue {
  const ctx = useContext(IntakeContext);
  if (!ctx) {
    throw new Error('useIntake must be used within an IntakeProvider');
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const IntakeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(intakeReducer, initialState);
  const router = useRouter();

  const totalSteps = getVisibleSteps(state.answers).length;

  const setAnswer = (key: keyof HabitProfile, value: unknown) => {
    dispatch({ type: 'SET_ANSWER', key, value });
  };

  const advance = () => {
    // If the current slider question was never touched, seed its default
    const visibleSteps = getVisibleSteps(state.answers);
    const currentKey = visibleSteps[state.currentStep];
    if (currentKey && state.answers[currentKey] === undefined && SLIDER_DEFAULTS[currentKey] !== undefined) {
      dispatch({ type: 'SET_ANSWER', key: currentKey, value: SLIDER_DEFAULTS[currentKey] });
    }
    dispatch({ type: 'ADVANCE' });
  };

  const back = () => {
    dispatch({ type: 'BACK' });
  };

  const complete = async (): Promise<void> => {
    const session: StoredSession = {
      schema_version: SCHEMA_VERSION,
      session_id: '',
      habit_profile: state.answers as HabitProfile,
      footprint_result: {
        total_tco2e: 0,
        breakdown: [],
        db_version: '',
        factors_used: {},
      },
      actions: [],
      created_at: new Date().toISOString(),
    };
    await saveSession(session);
    router.push('/results');
  };

  const value: IntakeContextValue = {
    answers: state.answers,
    currentStep: state.currentStep,
    totalSteps,
    setAnswer,
    advance,
    back,
    complete,
  };

  return (
    <IntakeContext.Provider value={value}>
      {children}
    </IntakeContext.Provider>
  );
};
