import { Platform, KeyboardAvoidingView, View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IntakeProvider, useIntake } from '../src/components/intake/IntakeContext';
import { QuestionCard } from '../src/components/intake/QuestionCard';
import { Colors } from '../src/theme/colors';
import { Fonts, FontSizes } from '../src/theme/typography';

function IntakeScreen() {
  const { currentStep, totalSteps } = useIntake();
  const insets = useSafeAreaInsets();
  const progress = (currentStep + 1) / totalSteps;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.brandMark}>CS</Text>
          <Text style={styles.stepCounter}>{currentStep + 1} of {totalSteps}</Text>
        </View>

        {/* Progress track */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        {/* Question */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <QuestionCard />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function IntakePage() {
  return (
    <IntakeProvider>
      <IntakeScreen />
    </IntakeProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandMark: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    color: Colors.accent,
    letterSpacing: 1.5,
  },
  stepCounter: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});
