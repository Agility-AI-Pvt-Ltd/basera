import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { ONBOARDING_COMPLETE_KEY } from '@/constants/StorageKeys';

async function readOnboardingComplete(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
    }

    const value = await SecureStore.getItemAsync(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

async function writeOnboardingComplete(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    return;
  }

  await SecureStore.setItemAsync(ONBOARDING_COMPLETE_KEY, 'true');
}

async function clearOnboardingComplete(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(ONBOARDING_COMPLETE_KEY);
}

export function useOnboardingStatus() {
  const [isReady, setIsReady] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    readOnboardingComplete()
      .then(setHasCompleted)
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await writeOnboardingComplete();
    setHasCompleted(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await clearOnboardingComplete();
    setHasCompleted(false);
  }, []);

  return { isReady, hasCompleted, completeOnboarding, resetOnboarding };
}
