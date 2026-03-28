import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface HouseholdStepperProps {
  value: number | undefined;
  onPress: (value: number) => void;
}

export function HouseholdStepper({ value, onPress }: HouseholdStepperProps) {
  const current = value ?? 1;

  return (
    <View style={styles.container}>
      <Text style={styles.valueLabel}>
        {current === 10 ? '10+' : current}
      </Text>
      <Text style={styles.valueUnit}>
        {current === 1 ? 'person' : 'people'}
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={current}
        onValueChange={(v) => onPress(Math.round(v))}
        minimumTrackTintColor={Colors.accent}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.accent}
        accessibilityLabel="Number of people in household"
      />
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>1</Text>
        <Text style={styles.rangeText}>10+</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
    alignItems: 'center',
  },
  valueLabel: {
    fontFamily: Fonts.displayRegular,
    fontSize: FontSizes['4xl'],
    color: Colors.accent,
    lineHeight: 52,
  },
  valueUnit: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  rangeText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
