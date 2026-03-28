import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../../theme/colors';

interface PercentageSliderProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function PercentageSlider({ value, onChange }: PercentageSliderProps) {
  const current = value ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.valueLabel}>{current}%</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={5}
        value={current}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.accent}
        accessibilityLabel="Percentage of unprocessed, unpackaged or locally grown food"
      />
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>None</Text>
        <Text style={styles.rangeText}>All</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  valueLabel: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.accent,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  rangeText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
