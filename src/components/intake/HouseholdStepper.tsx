import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface HouseholdStepperProps {
  value: number | undefined;
  onPress: (value: number) => void;
}

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function HouseholdStepper({ value, onPress }: HouseholdStepperProps) {
  return (
    <View style={styles.grid}>
      {NUMBERS.map((num) => {
        const selected = value === num;
        return (
          <Pressable
            key={num}
            style={selected ? styles.buttonSelected : styles.button}
            onPress={() => onPress(num)}
            accessibilityLabel={`${num} person${num === 1 ? '' : 's'}`}
            accessibilityRole="button"
          >
            <Text style={selected ? styles.textSelected : styles.text}>{num}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  textSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
