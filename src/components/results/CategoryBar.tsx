import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';
import type { CategoryBreakdown } from '../../types';

interface CategoryBarProps {
  breakdown: CategoryBreakdown;
}

const CATEGORY_EMOJIS: Record<CategoryBreakdown['category'], string> = {
  food: '🍽️',
  transport: '🚗',
  home_energy: '🏠',
  shopping: '🛍️',
};

const CATEGORY_NAMES: Record<CategoryBreakdown['category'], string> = {
  food: 'Food',
  transport: 'Transport',
  home_energy: 'Home Energy',
  shopping: 'Shopping',
};

const CATEGORY_COLORS: Record<CategoryBreakdown['category'], string> = {
  food: Colors.food,
  transport: Colors.transport,
  home_energy: Colors.homeEnergy,
  shopping: Colors.shopping,
};

function CategoryBar({ breakdown }: CategoryBarProps) {
  const { category, absolute_tco2e, percentage } = breakdown;
  const emoji = CATEGORY_EMOJIS[category];
  const name = CATEGORY_NAMES[category];
  const color = CATEGORY_COLORS[category];
  const fillWidth = Math.min(percentage, 100);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {emoji} {name}
        </Text>
        <Text style={styles.values}>
          {absolute_tco2e.toFixed(2)} tCO₂e · {Math.round(percentage)}%
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fillWidth}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default React.memo(CategoryBar);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  values: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
});
