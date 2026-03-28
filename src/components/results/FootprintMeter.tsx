import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MAX_SCALE, PARIS_TARGET, GLOBAL_AVG } from '../../types/index';
import { Colors } from '../../theme/colors';

// ── Pure helper functions (exported for testing) ─────────────────────────────

export function toPercent(value: number): number {
  const raw = (value / MAX_SCALE) * 100;
  return Math.min(Math.max(raw, 0), 100);
}

export function getAccentColor(value: number): string {
  if (value <= PARIS_TARGET) return Colors.green;
  if (value <= GLOBAL_AVG) return Colors.yellow;
  return Colors.red;
}

export function getLabel(value: number): string {
  if (value <= PARIS_TARGET) return 'Below Paris Target';
  if (value <= GLOBAL_AVG) return 'Above Paris Target';
  return 'Above Global Average';
}

// ── Component ─────────────────────────────────────────────────────────────────

interface FootprintMeterProps {
  totalTco2e: number;
}

const PARIS_MARKER_PCT = (PARIS_TARGET / MAX_SCALE) * 100;
const GLOBAL_MARKER_PCT = (GLOBAL_AVG / MAX_SCALE) * 100;

export default function FootprintMeter({ totalTco2e }: FootprintMeterProps) {
  const accentColor = getAccentColor(totalTco2e);
  const fillPercent = toPercent(totalTco2e);

  return (
    <View style={styles.container}>
      <Text style={[styles.totalValue, { color: accentColor }]}>
        {totalTco2e.toFixed(1)} tCO₂e / year
      </Text>
      <Text style={styles.label}>{getLabel(totalTco2e)}</Text>

      <View style={styles.barContainer}>
        {/* Fill */}
        <View style={[styles.barFill, { width: `${fillPercent}%` as any, backgroundColor: accentColor }]} />

        {/* Paris marker */}
        <View style={[styles.markerLine, { left: `${PARIS_MARKER_PCT}%` as any }]} />

        {/* Global avg marker */}
        <View style={[styles.markerLine, { left: `${GLOBAL_MARKER_PCT}%` as any }]} />
      </View>

      {/* Marker labels */}
      <View style={styles.markerLabelsRow}>
        <View style={[styles.markerLabelWrapper, { left: `${PARIS_MARKER_PCT}%` as any }]}>
          <Text style={styles.markerLabelText}>Paris</Text>
        </View>
        <View style={[styles.markerLabelWrapper, { left: `${GLOBAL_MARKER_PCT}%` as any }]}>
          <Text style={styles.markerLabelText}>Global avg</Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  barContainer: {
    height: 16,
    backgroundColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  markerLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#1A1A1A',
    opacity: 0.3,
  },
  markerLabelsRow: {
    position: 'relative',
    height: 20,
    marginTop: 4,
  },
  markerLabelWrapper: {
    position: 'absolute',
    transform: [{ translateX: -20 }],
  },
  markerLabelText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
