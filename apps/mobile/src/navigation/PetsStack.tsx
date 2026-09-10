import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PetsScreen from '@/src/screens/pets/PetsScreen';

import type { PetsStackParamList } from './types';

const Stack = createNativeStackNavigator<PetsStackParamList>();

export function PetsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Pets" component={PetsScreen} />
    </Stack.Navigator>
  );
}
