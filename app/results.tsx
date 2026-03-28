import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import FootprintMeter from '../src/components/results/FootprintMeter'
import CategoryBar from '../src/components/results/CategoryBar'
import ActionCard from '../src/components/results/ActionCard'
import { SkeletonCard } from '../src/components/results/SkeletonCard'
import { loadSession, saveSession, clearSession } from '../src/lib/storage'
import { analyzeHabits } from '../src/lib/api'
import { Colors } from '../src/theme/colors'
import type { StoredSession, Action, CategoryBreakdown } from '../src/types/index'

// ── Local fallback estimator ──────────────────────────────────────────────────
// Used when the backend is unreachable. Produces a rough but reasonable result.

function computeLocalEstimate(stored: StoredSession): StoredSession {
  const p = stored.habit_profile

  const foodBase: Record<string, number> = {
    'omnivore.daily': 3.3, 'omnivore.few_per_week': 2.5, 'omnivore.weekly': 1.9, 'omnivore.rarely': 1.5,
    'flexitarian.daily': 2.5, 'flexitarian.few_per_week': 2.0, 'flexitarian.weekly': 1.6, 'flexitarian.rarely': 1.3,
    'vegetarian.daily': 1.7, 'vegetarian.few_per_week': 1.5, 'vegetarian.weekly': 1.4, 'vegetarian.rarely': 1.3,
    'vegan.daily': 1.1, 'vegan.few_per_week': 1.0, 'vegan.weekly': 1.0, 'vegan.rarely': 0.9,
  }
  const food = (foodBase[`${p.diet_type}.${p.meat_frequency}`] ?? 1.7) * (1 - Math.min(p.local_food_pct / 10 * 0.03, 0.25))

  const carBase: Record<string, number> = { gasoline: 2.88, diesel: 2.57, hybrid: 1.65, electric: 0.80 }
  const transitBase: Record<string, number> = { transit: 0.45, cycling: 0.0, walking: 0.0 }
  const flightAdd: Record<string, number> = { none: 0, one_or_two: 0.6, several: 1.8, frequent: 4.0 }
  let transport = 0
  if (p.transport_method === 'car' && p.car_type) {
    const kmMultiplier = (p.weekly_km * 52) / 15000
    const econMultiplier = 1.4 + (0.5 - 1.4) * (p.fuel_economy / 100)
    transport = (carBase[p.car_type] ?? 2.88) * kmMultiplier * econMultiplier
  } else {
    transport = transitBase[p.transport_method] ?? 0.45
  }
  transport += flightAdd[p.flight_frequency] ?? 0

  const homeBase: Record<string, number> = { grid: 3.86, natural_gas: 2.02, renewables: 0.20, mixed: 2.50 }
  const home = (homeBase[p.home_energy_source] ?? 2.0) / Math.max(p.household_size, 1)

  const shopBase: Record<string, number> = { rarely: 0.3, monthly: 0.7, weekly: 1.5, daily: 3.0 }
  const wasteDelta = ((p.trash_vs_neighbors - 50) / 50) * 0.15
  const shopping = Math.max(0, (shopBase[p.shopping_frequency] ?? 0.7) + wasteDelta)

  const total = food + transport + home + shopping
  const pct = (v: number) => total > 0 ? Math.round((v / total) * 1000) / 10 : 0

  return {
    ...stored,
    session_id: 'local-estimate',
    footprint_result: {
      total_tco2e: Math.round(total * 100) / 100,
      breakdown: [
        { category: 'food', absolute_tco2e: Math.round(food * 100) / 100, percentage: pct(food), substituted: false },
        { category: 'transport', absolute_tco2e: Math.round(transport * 100) / 100, percentage: pct(transport), substituted: false },
        { category: 'home_energy', absolute_tco2e: Math.round(home * 100) / 100, percentage: pct(home), substituted: false },
        { category: 'shopping', absolute_tco2e: Math.round(shopping * 100) / 100, percentage: pct(shopping), substituted: false },
      ],
      db_version: '1.0-local',
      factors_used: {},
    },
    actions: [
      { id: 'local_1', description: 'Switch to a plant-rich diet by replacing beef with plant-based proteins at least 3 days per week.', savings_tco2e: 0.8, impact_label: 'your biggest lever', rank: 1, composite_score: 0.92 },
      { id: 'local_2', description: 'Replace one short-haul flight per year with train or video-conference alternatives.', savings_tco2e: 0.6, impact_label: 'high impact', rank: 2, composite_score: 0.78 },
      { id: 'local_3', description: 'Switch your home energy tariff to a certified renewable electricity provider.', savings_tco2e: 0.5, impact_label: 'high impact', rank: 3, composite_score: 0.71 },
    ],
  }
}

export default function ResultsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [session, setSession] = useState<StoredSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const stored = await loadSession()

      if (!stored) {
        router.replace('/intake')
        return
      }

      if (stored.footprint_result.total_tco2e > 0) {
        setSession(stored)
        setLoading(false)
        return
      }

      try {
        const result = await analyzeHabits(stored.habit_profile)
        const updated: StoredSession = {
          ...stored,
          session_id: result.session_id,
          footprint_result: result.footprint,
          actions: result.actions,
        }
        await saveSession(updated)
        setSession(updated)
      } catch {
        // Backend unavailable — compute a local estimate so the user
        // still sees results instead of an error screen.
        const updated = computeLocalEstimate(stored)
        await saveSession(updated)
        setSession(updated)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  async function handleRetake() {
    await clearSession()
    router.replace('/intake')
  }

  const sortedActions: Action[] = session
    ? [...session.actions].sort((a, b) => a.rank - b.rank)
    : []

  const breakdown: CategoryBreakdown[] = session?.footprint_result.breakdown ?? []

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          style={styles.button}
          onPress={() => router.replace('/intake')}
          accessibilityLabel="Try again"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Carbon Footprint</Text>
        <View style={styles.headerButtons}>
          <Pressable
            style={styles.homeButton}
            onPress={() => router.replace('/')}
            accessibilityLabel="Go to home"
            accessibilityRole="button"
          >
            <Text style={styles.homeText}>Home</Text>
          </Pressable>
          <Pressable
            style={styles.retakeButton}
            onPress={handleRetake}
            accessibilityLabel="Retake quiz"
            accessibilityRole="button"
          >
            <Text style={styles.retakeText}>Retake</Text>
          </Pressable>
        </View>
      </View>

      {/* Footprint Meter */}
      {session && (
        <View style={styles.card}>
          <FootprintMeter totalTco2e={session.footprint_result.total_tco2e} />
        </View>
      )}

      {/* Category Breakdown */}
      <Text style={styles.sectionTitle}>Breakdown by Category</Text>
      <View style={styles.card}>
        <FlashList
          data={breakdown}
          keyExtractor={(item) => item.category}
          renderItem={({ item }) => <CategoryBar breakdown={item} />}
          estimatedItemSize={80}
          scrollEnabled={false}
        />
      </View>

      {/* Action Cards */}
      <Text style={styles.sectionTitle}>Top Actions</Text>
      {sortedActions.length === 0 ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlashList
          data={sortedActions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ActionCard action={item} />}
          estimatedItemSize={100}
          scrollEnabled={false}
        />
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        Estimates based on EPA · IPCC AR6 · Our World in Data
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  homeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
  homeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  retakeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
})
