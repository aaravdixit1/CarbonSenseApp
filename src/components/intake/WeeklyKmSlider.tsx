import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../../theme/colors';

interface WeeklyKmSliderProps {
  value: number | undefined;
  onChange: (value: number) => void;
}

export function WeeklyKmSlider({ value, onChange }: WeeklyKmSliderProps) {
  const current = value ?? 0;
  const miles = Math.round(current * 0.621);

  return (
    <View style={styles.container}>
      <Text style={styles.valueLabel}>
        {current >= 500 ? '500+ km' : `${current} km`}
      </Text>
      <Text style={styles.milesLabel}>
        {current >= 500 ? `${Math.round(500 * 0.621)}+ mi` : `${miles} mi`}
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={500}
        step={5}
        value={current}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.accent}
        accessibilityLabel="Weekly distance travelled by car or motorcycle"
      />
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>Zero</Text>
        <Text style={styles.rangeText}>Very far</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  valueLabel: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.accent,
    textAlign: 'center',
  },
  milesLabel: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
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
