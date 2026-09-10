import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdoptionSetupScreen from '@/src/screens/signup/AdoptionSetupScreen';
import BasicsScreen from '@/src/screens/signup/BasicsScreen';
import DogForkScreen from '@/src/screens/signup/DogForkScreen';
import PacksScreen from '@/src/screens/signup/PacksScreen';
import PetProfileScreen from '@/src/screens/signup/PetProfileScreen';

import type { SignupRouteName, SignupStackParamList } from './types';

const Stack = createNativeStackNavigator<SignupStackParamList>();

type SignupStackProps = {
  initialRouteName?: SignupRouteName;
};

export function SignupStack({ initialRouteName = 'Basics' }: SignupStackProps) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Basics" component={BasicsScreen} />
      <Stack.Screen name="DogFork" component={DogForkScreen} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />
      <Stack.Screen name="AdoptionSetup" component={AdoptionSetupScreen} />
      <Stack.Screen name="Packs" component={PacksScreen} />
    </Stack.Navigator>
  );
}
