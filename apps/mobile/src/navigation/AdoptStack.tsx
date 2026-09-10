import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdoptScreen from '@/src/screens/adopt/AdoptScreen';

import type { AdoptStackParamList } from './types';

const Stack = createNativeStackNavigator<AdoptStackParamList>();

export function AdoptStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Adopt" component={AdoptScreen} />
    </Stack.Navigator>
  );
}
