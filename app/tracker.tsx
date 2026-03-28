import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadSession, getTodayLog, saveDailyLog, loadDailyLogs } from '../src/lib/storage';
import { DAILY_HABITS, CATEGORY_META } from '../src/lib/dailyHabits';
import { Colors } from '../src/theme/colors';
import { Fonts, FontSizes } from '../src/theme/typography';
import type { StoredSession, DailyLog, DailyHabit } from '../src/types/index';

const TODAY = new Date().toISOString().split('T')[0];

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function totalSavings(ids: string[]): number {
  return ids.reduce((sum, id) => {
    const h = DAILY_HABITS.find((h) => h.id === id);
    return sum + (h?.savings_kg ?? 0);
  }, 0);
}

// ── Habit Row ─────────────────────────────────────────────────────────────────

function HabitRow({
  habit,
  checked,
  onToggle,
}: {
  habit: DailyHabit;
  checked: boolean;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[habit.category];
  return (
    <Pressable
      style={({ pressed }) => [styles.habitRow, checked && styles.habitRowChecked, pressed && styles.habitRowPressed]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={habit.label}
    >
      <View style={[styles.checkBox, checked && styles.checkBoxChecked]}>
        {checked && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <View style={styles.habitText}>
        <Text style={[styles.habitLabel, checked && styles.habitLabelChecked]}>{habit.label}</Text>
        <Text style={styles.habitDesc}>{habit.description}</Text>
      </View>
      <View style={[styles.savingsBadge, { backgroundColor: meta.color + '40' }]}>
        <Text style={[styles.savingsText, { color: meta.color.replace('40', '') }]}>
          -{habit.savings_kg} kg
        </Text>
      </View>
    </Pressable>
  );
}

// ── Streak Badge ──────────────────────────────────────────────────────────────

function StreakBadge({ logs }: { logs: DailyLog[] }) {
  // Count consecutive days with at least one habit
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const log = logs.find((l) => l.date === key);
    if (log && log.completed_habit_ids.length > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return (
    <View style={styles.streakBadge}>
      <Text style={styles.streakEmoji}>🔥</Text>
      <Text style={styles.streakCount}>{streak}</Text>
      <Text style={styles.streakLabel}>day streak</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<StoredSession | null>(null);
  const [todayLog, setTodayLog] = useState<DailyLog>({ date: TODAY, completed_habit_ids: [] });
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [s, log, logs] = await Promise.all([loadSession(), getTodayLog(), loadDailyLogs()]);
      if (!s) { router.replace('/'); return; }
      setSession(s);
      if (log) setTodayLog(log);
      setAllLogs(logs);
      setLoading(false);
    }
    init();
  }, []);

  const toggle = useCallback(async (id: string) => {
    setTodayLog((prev) => {
      const ids = prev.completed_habit_ids.includes(id)
        ? prev.completed_habit_ids.filter((x) => x !== id)
        : [...prev.completed_habit_ids, id];
      const updated = { ...prev, completed_habit_ids: ids };
      saveDailyLog(updated);
      return updated;
    });
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    );
  }

  const saved = totalSavings(todayLog.completed_habit_ids);
  const checkedCount = todayLog.completed_habit_ids.length;

  // Group habits by category
  const categories = ['transport', 'food', 'home_energy', 'shopping'] as const;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.dateLabel}>{formatDate(TODAY)}</Text>
      </View>

      {/* Title + streak */}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Daily Habits</Text>
          <Text style={styles.subtitle}>Track what you did today</Text>
        </View>
        <StreakBadge logs={allLogs} />
      </View>

      {/* Today's summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{checkedCount}</Text>
          <Text style={styles.summaryLabel}>habits{'\n'}completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{saved.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>kg CO₂e{'\n'}saved today</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {session ? (session.footprint_result.total_tco2e * 1000 / 365).toFixed(1) : '—'}
          </Text>
          <Text style={styles.summaryLabel}>kg CO₂e{'\n'}daily baseline</Text>
        </View>
      </View>

      {/* Habits by category */}
      {categories.map((cat) => {
        const habits = DAILY_HABITS.filter((h) => h.category === cat);
        const meta = CATEGORY_META[cat];
        return (
          <View key={cat} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.categoryDot, { backgroundColor: meta.color }]} />
              <Text style={styles.sectionTitle}>{meta.label}</Text>
            </View>
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                checked={todayLog.completed_habit_ids.includes(habit.id)}
                onToggle={() => toggle(habit.id)}
              />
            ))}
          </View>
        );
      })}

      {/* Past 7 days mini log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Past 7 Days</Text>
        <View style={styles.weekRow}>
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const key = d.toISOString().split('T')[0];
            const log = allLogs.find((l) => l.date === key);
            const count = log?.completed_habit_ids.length ?? 0;
            const isToday = key === TODAY;
            const intensity = count === 0 ? 0 : Math.min(count / 5, 1);
            return (
              <View key={key} style={styles.dayCell}>
                <View
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: count > 0
                        ? `rgba(30, 61, 15, ${0.2 + intensity * 0.8})`
                        : Colors.border,
                      borderWidth: isToday ? 2 : 0,
                      borderColor: Colors.accent,
                    },
                  ]}
                />
                <Text style={styles.dayLabel}>
                  {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                </Text>
                {count > 0 && <Text style={styles.dayCount}>{count}</Text>}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20 },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { paddingVertical: 4 },
  backBtnText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.sm, color: Colors.accent },
  dateLabel: { fontFamily: Fonts.sansRegular, fontSize: FontSizes.sm, color: Colors.textMuted },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titleBlock: { gap: 4 },
  title: { fontFamily: Fonts.displayRegular, fontSize: 36, color: Colors.textPrimary, lineHeight: 40 },
  subtitle: { fontFamily: Fonts.sansRegular, fontSize: FontSizes.sm, color: Colors.textMuted },

  streakBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 2,
  },
  streakEmoji: { fontSize: 18 },
  streakCount: { fontFamily: Fonts.displayRegular, fontSize: FontSizes.xl, color: Colors.textInverse, lineHeight: 26 },
  streakLabel: { fontFamily: Fonts.sansRegular, fontSize: 10, color: Colors.accentLight },

  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 4 },
  summaryValue: { fontFamily: Fonts.displayRegular, fontSize: FontSizes['2xl'], color: Colors.accent },
  summaryLabel: { fontFamily: Fonts.sansRegular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', lineHeight: 16 },
  summaryDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  sectionTitle: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },

  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  habitRowChecked: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  habitRowPressed: { opacity: 0.8 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkBoxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkMark: { color: '#fff', fontSize: 13, fontFamily: Fonts.sansBold },
  habitText: { flex: 1, gap: 2 },
  habitLabel: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.base, color: Colors.textPrimary },
  habitLabelChecked: { color: Colors.accent, fontFamily: Fonts.sansSemiBold },
  habitDesc: { fontFamily: Fonts.sansRegular, fontSize: FontSizes.xs, color: Colors.textMuted, lineHeight: 16 },
  savingsBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  savingsText: { fontFamily: Fonts.sansMedium, fontSize: FontSizes.xs },

  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCell: { alignItems: 'center', gap: 4 },
  dayDot: { width: 32, height: 32, borderRadius: 16 },
  dayLabel: { fontFamily: Fonts.sansRegular, fontSize: 10, color: Colors.textMuted },
  dayCount: { fontFamily: Fonts.sansBold, fontSize: 10, color: Colors.accent },
});
