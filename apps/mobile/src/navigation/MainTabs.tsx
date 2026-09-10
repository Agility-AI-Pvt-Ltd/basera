import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

import { FloatingTabBar } from '@/components/FloatingTabBar';

import { AdoptStack } from './AdoptStack';
import { CommunityStack } from './CommunityStack';
import { HomeStack } from './HomeStack';
import { PetsStack } from './PetsStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="AdoptTab" component={AdoptStack} options={{ title: 'Adopt' }} />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStack}
        options={{ title: 'Community' }}
      />
      <Tab.Screen name="PetsTab" component={PetsStack} options={{ title: 'Pets' }} />
    </Tab.Navigator>
  );
}
