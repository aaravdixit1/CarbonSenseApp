import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/theme/colors';
import { PARIS_TARGET, GLOBAL_AVG } from '../src/types/index';

const STATS = [
  { value: `${GLOBAL_AVG}t`, label: 'Global Average', sublabel: 'CO₂/year' },
  { value: `${PARIS_TARGET}t`, label: 'Paris Target', sublabel: 'CO₂/year' },
  { value: '8', label: 'Questions', sublabel: 'to complete' },
];

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.appName}>CarbonSense</Text>

      <View style={styles.heroSection}>
        <Text style={styles.headline}>Understand Your Carbon Footprint</Text>
        <Text style={styles.description}>
          Answer 8 quick questions about your lifestyle and get personalized
          recommendations to reduce your environmental impact.
        </Text>
      </View>

      <View style={styles.statsRow}>
        {STATS.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statSublabel}>{stat.sublabel}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.ctaButton}
        onPress={() => router.push('/intake')}
        accessibilityLabel="Calculate My Footprint"
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Calculate My Footprint</Text>
      </Pressable>
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
    paddingHorizontal: 24,
    gap: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.accent,
    textAlign: 'center',
  },
  heroSection: {
    gap: 12,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accent,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statSublabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  ctaButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
