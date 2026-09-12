import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '@/src/screens/home/HomeScreen';
import EditLocationScreen from '@/src/screens/settings/EditLocationScreen';
import EditPersonalInfoScreen from '@/src/screens/settings/EditPersonalInfoScreen';
import EditPhotoScreen from '@/src/screens/settings/EditPhotoScreen';
import SettingsMenuScreen from '@/src/screens/settings/SettingsMenuScreen';

import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SettingsMenu" component={SettingsMenuScreen} />
      <Stack.Screen name="EditPersonalInfo" component={EditPersonalInfoScreen} />
      <Stack.Screen name="EditPhoto" component={EditPhotoScreen} />
      <Stack.Screen name="EditLocation" component={EditLocationScreen} />
    </Stack.Navigator>
  );
}
