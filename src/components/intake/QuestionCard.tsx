import { FC, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { HabitProfile } from '../../types/index';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';
import { OptionButton } from './OptionButton';
import { HouseholdStepper } from './HouseholdStepper';
import { PercentageSlider } from './PercentageSlider';
import { WeeklyKmSlider } from './WeeklyKmSlider';
import { ScaleSlider } from './ScaleSlider';
import { useIntake, getVisibleSteps } from './IntakeContext';

// ── Question Config ───────────────────────────────────────────────────────────

interface OptionConfig {
  label: string;
  value: string;
}

export interface QuestionConfig {
  question: string;
  type: 'options' | 'stepper' | 'percentage' | 'weekly_km' | 'scale';
  options?: OptionConfig[];
  scaleMin?: string;
  scaleMax?: string;
}

export const QUESTIONS: Partial<Record<keyof HabitProfile, QuestionConfig>> = {
  transport_method: {
    question: 'How do you primarily get around?',
    type: 'options',
    options: [
      { label: 'Car', value: 'car' },
      { label: 'Public Transit', value: 'transit' },
      { label: 'Cycling', value: 'cycling' },
      { label: 'Walking', value: 'walking' },
    ],
  },
  car_type: {
    question: 'What type of car do you drive?',
    type: 'options',
    options: [
      { label: 'Gasoline', value: 'gasoline' },
      { label: 'Diesel', value: 'diesel' },
      { label: 'Hybrid', value: 'hybrid' },
      { label: 'Electric', value: 'electric' },
    ],
  },
  weekly_km: {
    question: 'How far do you travel by car or motorcycle each week?',
    type: 'weekly_km',
  },
  fuel_economy: {
    question: 'What is the average fuel economy of the vehicles you use most often?',
    type: 'scale',
    scaleMin: 'Inefficient',
    scaleMax: 'Efficient or Electric',
  },
  diet_type: {
    question: 'How would you describe your diet?',
    type: 'options',
    options: [
      { label: 'Omnivore', value: 'omnivore' },
      { label: 'Flexitarian', value: 'flexitarian' },
      { label: 'Vegetarian', value: 'vegetarian' },
      { label: 'Vegan', value: 'vegan' },
    ],
  },
  meat_frequency: {
    question: 'How often do you eat meat?',
    type: 'options',
    options: [
      { label: 'Daily', value: 'daily' },
      { label: 'A few times a week', value: 'few_per_week' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Rarely', value: 'rarely' },
    ],
  },
  local_food_pct: {
    question: 'How much of the food that you eat is unprocessed, unpackaged or locally grown?',
    type: 'percentage',
  },
  home_energy_source: {
    question: 'What powers your home?',
    type: 'options',
    options: [
      { label: 'Grid Electricity', value: 'grid' },
      { label: 'Natural Gas', value: 'natural_gas' },
      { label: 'Renewables', value: 'renewables' },
      { label: 'Mixed', value: 'mixed' },
    ],
  },
  household_size: {
    question: 'How many people live in your household?',
    type: 'stepper',
  },
  trash_vs_neighbors: {
    question: 'Compared to your neighbors, how much trash do you generate?',
    type: 'scale',
    scaleMin: 'Much Less',
    scaleMax: 'Much More',
  },
  shopping_frequency: {
    question: 'How often do you buy new clothes or goods?',
    type: 'options',
    options: [
      { label: 'Rarely', value: 'rarely' },
      { label: 'Monthly', value: 'monthly' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Daily', value: 'daily' },
    ],
  },
  flight_frequency: {
    question: 'How often do you fly per year?',
    type: 'options',
    options: [
      { label: 'Never', value: 'none' },
      { label: '1–2 flights', value: 'one_or_two' },
      { label: 'Several flights', value: 'several' },
      { label: 'Frequent flyer', value: 'frequent' },
    ],
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Header: FC<{ stepNumber: number; question: string }> = ({ stepNumber, question }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.stepLabel}>Question {stepNumber}</Text>
    <Text style={styles.questionText}>{question}</Text>
  </View>
);

const Options: FC<{
  stepKey: keyof HabitProfile;
  value: unknown;
  onChange: (v: unknown) => void;
}> = ({ stepKey, value, onChange }) => {
  const config = QUESTIONS[stepKey];
  if (!config) return null;

  if (config.type === 'stepper') {
    return (
      <HouseholdStepper
        value={value as number | undefined}
        onPress={onChange}
      />
    );
  }

  if (config.type === 'percentage') {
    return (
      <PercentageSlider
        value={value as number | undefined}
        onChange={onChange}
      />
    );
  }

  if (config.type === 'weekly_km') {
    return (
      <WeeklyKmSlider
        value={value as number | undefined}
        onChange={onChange}
      />
    );
  }

  if (config.type === 'scale') {
    return (
      <ScaleSlider
        value={value as number | undefined}
        onChange={onChange}
        minLabel={config.scaleMin ?? ''}
        maxLabel={config.scaleMax ?? ''}
      />
    );
  }

  return (
    <View style={styles.optionsContainer}>
      {config.options?.map((opt) => (
        <OptionButton
          key={opt.value}
          label={opt.label}
          value={opt.value}
          selected={value === opt.value}
          onPress={onChange}
        />
      ))}
    </View>
  );
};

const Nav: FC<{
  canGoBack: boolean;
  hasAnswer: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
}> = ({ canGoBack, hasAnswer, isLast, onBack, onNext }) => (
  <View style={styles.navContainer}>
    {canGoBack && (
      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    )}
    <Pressable
      style={[styles.nextButton, !hasAnswer && styles.nextButtonDisabled]}
      onPress={hasAnswer ? onNext : undefined}
      accessibilityLabel={isLast ? 'See Results' : 'Continue'}
      accessibilityRole="button"
    >
      <Text style={styles.nextButtonText}>{isLast ? 'See Results' : 'Continue'}</Text>
    </Pressable>
  </View>
);

// ── Namespace export ──────────────────────────────────────────────────────────

export const Question = { Header, Options, Nav };

// ── QuestionCard ──────────────────────────────────────────────────────────────

export const QuestionCard: FC = () => {
  const { answers, currentStep, totalSteps, setAnswer, advance, back, complete } = useIntake();

  const visibleSteps = getVisibleSteps(answers);
  const stepKey = visibleSteps[currentStep];
  const config = QUESTIONS[stepKey];

  if (!config) return null;

  const currentValue = answers[stepKey];
  const hasAnswer = currentValue !== undefined && currentValue !== null;
  const isLast = currentStep === totalSteps - 1;
  const canGoBack = currentStep > 0;

  const handleNext = () => {
    if (isLast) {
      complete();
    } else {
      advance();
    }
  };

  return (
    <View style={styles.card}>
      <Question.Header stepNumber={currentStep + 1} question={config.question} />
      <Question.Options stepKey={stepKey} value={currentValue} onChange={(v) => setAnswer(stepKey, v)} />
      <Question.Nav
        canGoBack={canGoBack}
        hasAnswer={hasAnswer}
        isLast={isLast}
        onBack={back}
        onNext={handleNext}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 28,
    gap: 28,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerContainer: {
    gap: 10,
  },
  stepLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.xs,
    color: Colors.accentMid,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  questionText: {
    fontFamily: Fonts.displayRegular,
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 34,
    letterSpacing: -0.2,
  },
  optionsContainer: {
    gap: 0,
  },
  navContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  backButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
  },
  nextButton: {
    flex: 2,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    backgroundColor: Colors.accent,
  },
  nextButtonDisabled: {
    opacity: 0.35,
  },
  nextButtonText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSizes.base,
    color: Colors.textInverse,
    letterSpacing: 0.2,
  },
});
