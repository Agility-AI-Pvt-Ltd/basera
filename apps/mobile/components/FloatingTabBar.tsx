import Feather from '@expo/vector-icons/Feather';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BRAND_PURPLE = '#A78BFA';
const TAB_SIZE = 54;
const BAR_HEIGHT = 70;

type TabConfig = {
  routeName: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
};

const TABS: TabConfig[] = [
  { routeName: 'HomeTab', icon: 'home', label: 'Home' },
  { routeName: 'AdoptTab', icon: 'heart', label: 'Adopt' },
  { routeName: 'CommunityTab', icon: 'users', label: 'Community' },
  { routeName: 'PetsTab', icon: 'smile', label: 'Pets' },
];

const SPRING = {
  damping: 18,
  stiffness: 380,
  mass: 0.55,
};

/** Nested routes where the floating tab bar should be hidden. */
const HIDE_TAB_BAR_ROUTES: Record<string, Set<string>> = {
  HomeTab: new Set(['SettingsMenu', 'EditPersonalInfo', 'EditPhoto', 'EditLocation']),
  AdoptTab: new Set([
    'CreateListing',
    'ListingDetail',
    'ApplyAdoption',
    'MyAdoption',
    'ListerApplications',
    'ApplicationReview',
    'AdoptionChat',
  ]),
  CommunityTab: new Set([
    'PackDetail',
    'CreatePack',
    'MeetupDetail',
    'CreateMeetup',
    'NeighborDetail',
  ]),
  PetsTab: new Set([
    'CreatePetProfile',
    'EditPetProfile',
    'AddHealthSchedule',
    'UploadDocument',
    'TrainingOnboarding',
    'TrainingPreferences',
    'NutritionOnboarding',
    'NutritionPreferences',
    'PetDetail',
  ]),
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const indicatorX = useSharedValue(0);

  const activeTabRoute = state.routes[state.index];
  const nestedRouteName =
    getFocusedRouteNameFromRoute(activeTabRoute) ??
    (activeTabRoute.name === 'HomeTab' ? 'Home' : 'MyPetsList');
  const hideTabBar = HIDE_TAB_BAR_ROUTES[activeTabRoute.name]?.has(nestedRouteName) ?? false;

  const tabRoutes = TABS.map(
    (tab) => state.routes.find((r) => r.name === tab.routeName)!,
  ).filter(Boolean);

  const activeRouteKey = state.routes[state.index]?.key;
  const activeTabIndex = tabRoutes.findIndex((r) => r.key === activeRouteKey);
  const safeActiveIndex = activeTabIndex >= 0 ? activeTabIndex : 0;

  useEffect(() => {
    indicatorX.value = withSpring(safeActiveIndex, SPRING);
  }, [safeActiveIndex, indicatorX]);

  const barWidth = TAB_SIZE * TABS.length + 32;
  const slotWidth = barWidth / TABS.length;

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value * slotWidth + slotWidth / 2 - TAB_SIZE / 2 }],
  }));

  if (hideTabBar) {
    return null;
  }

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none">
      <View style={[styles.shadow, { width: barWidth }]}>
        <View style={[styles.bar, { width: barWidth, height: BAR_HEIGHT }]}>
          {TABS.slice(0, -1).map((_, i) => (
            <View
              key={i}
              style={[
                styles.connector,
                {
                  left: slotWidth * (i + 1) - 12,
                  width: 24,
                },
              ]}
            />
          ))}

          <Animated.View style={[styles.activeBubble, bubbleStyle]}>
            <View style={styles.activeBubbleInner} />
          </Animated.View>

          {TABS.map((tab) => {
            const route = tabRoutes.find((r) => r.name === tab.routeName);
            if (!route) return null;

            const routeIndex = state.routes.indexOf(route);
            const isFocused = state.index === routeIndex;
            const { options } = descriptors[route.key];

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
                onPress={onPress}
                style={styles.tabSlot}>
                <Feather
                  name={tab.icon}
                  size={22}
                  color={isFocused ? '#FFFFFF' : '#374151'}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  shadow: {
    borderRadius: BAR_HEIGHT / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
  },
  connector: {
    position: 'absolute',
    top: 8,
    height: BAR_HEIGHT - 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    zIndex: 0,
  },
  activeBubble: {
    position: 'absolute',
    top: (BAR_HEIGHT - TAB_SIZE) / 2,
    left: 0,
    width: TAB_SIZE,
    height: TAB_SIZE,
    zIndex: 1,
  },
  activeBubbleInner: {
    flex: 1,
    borderRadius: TAB_SIZE / 2,
    backgroundColor: BRAND_PURPLE,
    shadowColor: BRAND_PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  tabSlot: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
