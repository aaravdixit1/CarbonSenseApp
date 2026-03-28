import { Pressable, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface OptionButtonProps {
  label: string;
  value: unknown;
  selected: boolean;
  onPress: (value: unknown) => void;
}

export function OptionButton({ label, value, selected, onPress }: OptionButtonProps) {
  return (
    <Pressable
      style={selected ? styles.containerSelected : styles.container}
      onPress={() => onPress(value)}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={selected ? styles.textSelected : styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.card,
  },
  containerSelected: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.accent,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  textSelected: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
