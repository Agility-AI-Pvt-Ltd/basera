import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AddHealthScheduleScreen from '@/src/screens/pets/AddHealthScheduleScreen';
import CreatePetProfileScreen from '@/src/screens/pets/CreatePetProfileScreen';
import EditPetProfileScreen from '@/src/screens/pets/EditPetProfileScreen';
import MyPetsListScreen from '@/src/screens/pets/MyPetsListScreen';
import PetDetailScreen from '@/src/screens/pets/PetDetailScreen';
import NutritionOnboardingScreen from '@/src/screens/pets/NutritionOnboardingScreen';
import NutritionPreferencesScreen from '@/src/screens/pets/NutritionPreferencesScreen';
import TrainingOnboardingScreen from '@/src/screens/pets/TrainingOnboardingScreen';
import TrainingPreferencesScreen from '@/src/screens/pets/TrainingPreferencesScreen';
import UploadDocumentScreen from '@/src/screens/pets/UploadDocumentScreen';

import type { PetsStackParamList } from './types';

const Stack = createNativeStackNavigator<PetsStackParamList>();

export function PetsStack() {
  return (
    <Stack.Navigator
      initialRouteName="MyPetsList"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MyPetsList" component={MyPetsListScreen} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />
      <Stack.Screen name="CreatePetProfile" component={CreatePetProfileScreen} />
      <Stack.Screen name="EditPetProfile" component={EditPetProfileScreen} />
      <Stack.Screen name="AddHealthSchedule" component={AddHealthScheduleScreen} />
      <Stack.Screen name="UploadDocument" component={UploadDocumentScreen} />
      <Stack.Screen name="TrainingOnboarding" component={TrainingOnboardingScreen} />
      <Stack.Screen name="TrainingPreferences" component={TrainingPreferencesScreen} />
      <Stack.Screen name="NutritionOnboarding" component={NutritionOnboardingScreen} />
      <Stack.Screen name="NutritionPreferences" component={NutritionPreferencesScreen} />
    </Stack.Navigator>
  );
}
