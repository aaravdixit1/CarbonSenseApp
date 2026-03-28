import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.content}>
        <View style={[styles.line, styles.line1]} />
        <View style={[styles.line, styles.line2]} />
        <View style={[styles.line, styles.line3]} />
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
    height: 80,
  },
  accentBar: {
    width: 4,
    backgroundColor: Colors.border,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  line: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
  line1: {
    width: '40%',
  },
  line2: {
    width: '80%',
  },
  line3: {
    width: '60%',
  },
});
