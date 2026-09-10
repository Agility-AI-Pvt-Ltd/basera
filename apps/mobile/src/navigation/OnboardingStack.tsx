import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '@/src/screens/onboarding/OnboardingScreen';

export type OnboardingStackParamList = {
  Onboarding: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/** Shown when session exists but onboarding is incomplete. */
export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
