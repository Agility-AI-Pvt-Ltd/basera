import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet } from 'react-native';

type BackButtonProps = {
  onPress?: () => void;
  /** Used when there is no navigation history. */
  onFallback?: () => void;
};

export function BackButton({ onPress, onFallback }: BackButtonProps) {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    onFallback?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Go back">
      <FontAwesome name="angle-left" size={28} color="#111827" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
