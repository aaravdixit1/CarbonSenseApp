import { Platform, KeyboardAvoidingView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IntakeProvider, useIntake } from '../src/components/intake/IntakeContext';
import { QuestionCard } from '../src/components/intake/QuestionCard';
import { Colors } from '../src/theme/colors';

// ── Inner screen (must be inside IntakeProvider to use useIntake) ─────────────

function IntakeScreen() {
  const { currentStep, totalSteps } = useIntake();
  const insets = useSafeAreaInsets();

  const progressWidth = `${((currentStep + 1) / totalSteps) * 100}%` as const;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {/* Step counter */}
        <Text style={styles.stepCounter}>
          {currentStep + 1} / {totalSteps}
        </Text>

        {/* Question card */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <QuestionCard />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Default export wrapped in IntakeProvider ──────────────────────────────────

export default function IntakePage() {
  return (
    <IntakeProvider>
      <IntakeScreen />
    </IntakeProvider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  stepCounter: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'right',
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
