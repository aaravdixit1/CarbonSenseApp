import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/typography';

interface OptionButtonProps {
  label: string;
  value: unknown;
  selected: boolean;
  onPress: (value: unknown) => void;
}

export function OptionButton({ label, value, selected, onPress }: OptionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && !selected && styles.containerPressed,
      ]}
      onPress={() => onPress(value)}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={[styles.indicator, selected && styles.indicatorSelected]} />
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    backgroundColor: Colors.card,
  },
  containerSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  containerPressed: {
    backgroundColor: Colors.background,
  },
  indicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    backgroundColor: 'transparent',
  },
  indicatorSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  text: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  textSelected: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.accent,
  },
});
