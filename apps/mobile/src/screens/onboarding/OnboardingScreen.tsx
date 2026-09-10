import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OnboardingCarousel from '@/components/OnboardingCarousel';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import type { AuthStackParamList } from '@/src/navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { completeOnboarding } = useOnboardingStatus();

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    const routeNames = navigation.getState()?.routeNames ?? [];
    if (routeNames.includes('Phone')) {
      navigation.navigate('Phone');
    }
  }, [completeOnboarding, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <OnboardingCarousel
        onComplete={() => {
          void handleComplete();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
