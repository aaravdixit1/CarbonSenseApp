import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/theme/colors';
import { Fonts, FontSizes } from '../src/theme/typography';
import { PARIS_TARGET, GLOBAL_AVG } from '../src/types/index';

const STATS = [
  { value: `${GLOBAL_AVG}t`, label: 'Global Average', sublabel: 'CO₂ / year' },
  { value: `${PARIS_TARGET}t`, label: 'Paris Target', sublabel: 'CO₂ / year' },
];

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Wordmark */}
      <View style={styles.wordmarkRow}>
        <View style={styles.logoMark} />
        <Text style={styles.appName}>CarbonSense</Text>
      </View>

      {/* Hero */}
      <View style={styles.heroSection}>
        <Text style={styles.headline}>Know your{'\n'}footprint.</Text>
        <Text style={styles.description}>
          Answer a few questions about your lifestyle and discover your personal
          carbon footprint — with clear, actionable steps to reduce it.
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsHeading}>The numbers that matter</Text>
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statSublabel}>{stat.sublabel}</Text>
            </View>
          ))}
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>~10</Text>
            <Text style={styles.statLabel}>Questions</Text>
            <Text style={styles.statSublabel}>to complete</Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <Pressable
        style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaPressed]}
        onPress={() => router.push('/intake')}
        accessibilityLabel="Calculate My Footprint"
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Calculate My Footprint</Text>
        <Text style={styles.ctaArrow}>→</Text>
      </Pressable>

      <Text style={styles.disclaimer}>
        Takes about 2 minutes · No account required
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    gap: 36,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  appName: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSizes.md,
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  heroSection: {
    gap: 16,
    paddingTop: 8,
  },
  headline: {
    fontFamily: Fonts.displayRegular,
    fontSize: 52,
    color: Colors.textPrimary,
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: Fonts.sansRegular,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    maxWidth: 320,
  },
  statsCard: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  statsHeading: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.accentMid,
  },
  statValue: {
    fontFamily: Fonts.displayRegular,
    fontSize: FontSizes['2xl'],
    color: Colors.textInverse,
  },
  statLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.xs,
    color: Colors.accentLight,
    textAlign: 'center',
  },
  statSublabel: {
    fontFamily: Fonts.sansRegular,
    fontSize: 10,
    color: Colors.accentMid,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSizes.md,
    color: Colors.textInverse,
    letterSpacing: 0.2,
  },
  ctaArrow: {
    fontFamily: Fonts.sansRegular,
    fontSize: FontSizes.lg,
    color: Colors.accentLight,
  },
  disclaimer: {
    fontFamily: Fonts.sansRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: -16,
  },
});
