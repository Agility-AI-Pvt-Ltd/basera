import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '@/src/screens/onboarding/OnboardingScreen';
import OtpScreen from '@/src/screens/auth/OtpScreen';
import PhoneScreen from '@/src/screens/auth/PhoneScreen';

import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthStackProps = {
  initialRouteName?: keyof AuthStackParamList;
};

export function AuthStack({ initialRouteName = 'Onboarding' }: AuthStackProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Phone" component={PhoneScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
    </Stack.Navigator>
  );
}
