import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CommunityScreen from '@/src/screens/community/CommunityScreen';
import CreateMeetupScreen from '@/src/screens/community/CreateMeetupScreen';
import CreatePackScreen from '@/src/screens/community/CreatePackScreen';
import MeetupDetailScreen from '@/src/screens/community/MeetupDetailScreen';
import NeighborDetailScreen from '@/src/screens/community/NeighborDetailScreen';
import PackDetailScreen from '@/src/screens/community/PackDetailScreen';

import type { CommunityStackParamList } from './types';

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Community" component={CommunityScreen} />
      <Stack.Screen name="PackDetail" component={PackDetailScreen} />
      <Stack.Screen name="CreatePack" component={CreatePackScreen} />
      <Stack.Screen name="MeetupDetail" component={MeetupDetailScreen} />
      <Stack.Screen name="CreateMeetup" component={CreateMeetupScreen} />
      <Stack.Screen name="NeighborDetail" component={NeighborDetailScreen} />
    </Stack.Navigator>
  );
}
