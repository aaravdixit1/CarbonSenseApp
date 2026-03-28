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
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to calculate your footprint. Please check your connection and try again.'
        )
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
        <Pressable
          style={styles.retakeButton}
          onPress={handleRetake}
          accessibilityLabel="Retake quiz"
          accessibilityRole="button"
        >
          <Text style={styles.retakeText}>Retake</Text>
        </Pressable>
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
