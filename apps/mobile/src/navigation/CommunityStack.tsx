import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CommunityScreen from '@/src/screens/community/CommunityScreen';

import type { CommunityStackParamList } from './types';

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Community" component={CommunityScreen} />
    </Stack.Navigator>
  );
}
