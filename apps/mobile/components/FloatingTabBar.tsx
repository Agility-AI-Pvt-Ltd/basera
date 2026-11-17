import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';

const BRAND = '#5B21B6';
const BRAND_MUTED = '#9CA3AF';
const ACTIVE_BG = '#EDE9FE';

type TabConfig = {
  routeName: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  faIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
};

const TABS: TabConfig[] = [
  { routeName: 'HomeTab', icon: 'home', label: 'Home' },
  { routeName: 'AdoptTab', icon: 'heart', label: 'Adopt' },
  { routeName: 'CommunityTab', icon: 'users', label: 'Community' },
  { routeName: 'PetsTab', icon: 'tag', faIcon: 'paw', label: 'My Pets' },
];

/** Nested routes where the tab bar should be hidden. */
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

  const activeTabRoute = state.routes[state.index];
  const nestedRouteName =
    getFocusedRouteNameFromRoute(activeTabRoute) ??
    (activeTabRoute.name === 'HomeTab' ? 'Home' : 'MyPetsList');
  const hideTabBar = HIDE_TAB_BAR_ROUTES[activeTabRoute.name]?.has(nestedRouteName) ?? false;

  const tabRoutes = TABS.map(
    (tab) => state.routes.find((r) => r.name === tab.routeName)!,
  ).filter(Boolean);

  if (hideTabBar) {
    return null;
  }

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}
      pointerEvents="box-none">
      <View style={styles.bar}>
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
              <View style={[styles.iconPill, isFocused && styles.iconPillActive]}>
                {tab.faIcon ? (
                  <FontAwesome
                    name={tab.faIcon}
                    size={20}
                    color={isFocused ? BRAND : BRAND_MUTED}
                  />
                ) : (
                  <Feather
                    name={tab.icon}
                    size={22}
                    color={isFocused ? BRAND : BRAND_MUTED}
                  />
                )}
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
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
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabSlot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconPill: {
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 999,
  },
  iconPillActive: {
    backgroundColor: ACTIVE_BG,
  },
  tabLabel: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    color: BRAND_MUTED,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: BRAND,
    fontWeight: '700',
  },
});