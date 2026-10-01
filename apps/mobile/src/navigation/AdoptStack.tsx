import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdoptScreen from '@/src/screens/adopt/AdoptScreen';
import AdoptionChatScreen from '@/src/screens/adopt/AdoptionChatScreen';
import ApplicationReviewScreen from '@/src/screens/adopt/ApplicationReviewScreen';
import ApplyAdoptionScreen from '@/src/screens/adopt/ApplyAdoptionScreen';
import CreateListingScreen from '@/src/screens/adopt/CreateListingScreen';
import ListingDetailScreen from '@/src/screens/adopt/ListingDetailScreen';
import ListerApplicationsScreen from '@/src/screens/adopt/ListerApplicationsScreen';
import MyAdoptionScreen from '@/src/screens/adopt/MyAdoptionScreen';

import type { AdoptStackParamList } from './types';

const Stack = createNativeStackNavigator<AdoptStackParamList>();

export function AdoptStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Adopt" component={AdoptScreen} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <Stack.Screen name="ApplyAdoption" component={ApplyAdoptionScreen} />
      <Stack.Screen name="MyAdoption" component={MyAdoptionScreen} />
      <Stack.Screen name="ListerApplications" component={ListerApplicationsScreen} />
      <Stack.Screen name="ApplicationReview" component={ApplicationReviewScreen} />
      <Stack.Screen name="AdoptionChat" component={AdoptionChatScreen} />
    </Stack.Navigator>
  );
}
