import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import type { Action } from '../../types/index';

interface ActionCardProps {
  action: Action;
}

const RANK_LABELS: Record<number, string> = {
  1: '#1 Impact',
  2: '#2 Impact',
  3: '#3 Impact',
};

const RANK_COLORS: Record<number, string> = {
  1: Colors.rank1,
  2: Colors.rank2,
  3: Colors.rank3,
};

function ActionCard({ action }: ActionCardProps) {
  const rankColor = RANK_COLORS[action.rank] ?? Colors.rank1;
  const rankLabel = RANK_LABELS[action.rank] ?? `#${action.rank} Impact`;
  const badgeBg = rankColor + '20';
  const savings = '\u2212' + action.savings_tco2e.toFixed(1) + ' tCO\u2082e/yr';

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: rankColor }]} />
      <View style={styles.content}>
        <Text style={[styles.rankLabel, { color: rankColor }]}>{rankLabel}</Text>
        <Text style={styles.description}>{action.description}</Text>
        <View style={styles.bottomRow}>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: rankColor }]}>{action.impact_label}</Text>
          </View>
          <Text style={styles.savings}>{savings}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  rankLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  savings: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

export default React.memo(ActionCard);
