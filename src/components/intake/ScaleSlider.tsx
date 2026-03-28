import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../../theme/colors';

interface ScaleSliderProps {
  value: number | undefined;
  onChange: (value: number) => void;
  minLabel: string;
  maxLabel: string;
  accessibilityLabel?: string;
}

export function ScaleSlider({ value, onChange, minLabel, maxLabel, accessibilityLabel }: ScaleSliderProps) {
  const current = value ?? 50;

  return (
    <View style={styles.container}>
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
        accessibilityLabel={accessibilityLabel}
      />
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>{minLabel}</Text>
        <Text style={styles.rangeText}>{maxLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
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
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
