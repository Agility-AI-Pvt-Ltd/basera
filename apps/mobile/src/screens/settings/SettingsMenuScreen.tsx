import Feather from '@expo/vector-icons/Feather';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/UserAvatar';
import { BackButton } from '@/components/BackButton';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { HomeStackParamList } from '@/src/navigation/types';

const BRAND = '#7C3AED';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'SettingsMenu'>;

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
  destructive?: boolean;
};

export default function SettingsMenuScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const { email, signOut } = useAuthStatus();

  const [loggingOut, setLoggingOut] = useState(false);

  const confirmLogout = (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      return Promise.resolve(window.confirm('Log out of Basera?'));
    }
    return new Promise((resolve) => {
      Alert.alert('Log out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Log out', style: 'destructive', onPress: () => resolve(true) },
      ]);
    });
  };

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (!confirmed || loggingOut) return;

    setLoggingOut(true);
    try {
      await signOut();
      // App.tsx gate switches to AuthStack when session clears.
    } catch (err) {
      Alert.alert(
        'Could not log out',
        err instanceof Error ? err.message : 'Please try again.',
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const items: MenuItem[] = [
    {
      id: 'personal',
      label: 'Personal information',
      icon: 'user',
      onPress: () => navigation.navigate('EditPersonalInfo'),
    },
    {
      id: 'photo',
      label: 'Change photo',
      icon: 'camera',
      onPress: () => navigation.navigate('EditPhoto'),
    },
    {
      id: 'location',
      label: 'Change location',
      icon: 'map-pin',
      onPress: () => navigation.navigate('EditLocation'),
    },
    {
      id: 'logout',
      label: loggingOut ? 'Logging out…' : 'Log out',
      icon: 'log-out',
      onPress: () => {
        void handleLogout();
      },
      destructive: true,
    },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.profileCard}>
        <UserAvatar photoUri={profile?.photoUri} size={72} />
        <Text style={styles.name}>{profile?.name || 'Your profile'}</Text>
        <Text style={styles.phone}>{email || '—'}</Text>
        {profile?.city ? (
          <Text style={styles.location}>
            {profile.locality ? `${profile.locality}, ` : ''}
            {profile.city}
          </Text>
        ) : null}
      </View>

      <View style={styles.menu}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={item.onPress}
            style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
            <View style={[styles.iconWrap, item.destructive && styles.iconWrapDestructive]}>
              <Feather
                name={item.icon}
                size={18}
                color={item.destructive ? '#EF4444' : BRAND}
              />
            </View>
            <Text style={[styles.menuLabel, item.destructive && styles.menuLabelDestructive]}>
              {item.label}
            </Text>
            {!item.destructive ? (
              <Feather name="chevron-right" size={18} color="#9CA3AF" />
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
    fontSize: 18,
    fontWeight: '200',
    color: '#111827',
  },
  spacer: { width: 44 },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  name: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: '200',
    color: '#111827',
    marginTop: 8,
  },
  phone: { fontSize: 14, color: '#6B7280' },
  location: { fontSize: 13, color: '#9CA3AF' },
  menu: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  menuRowPressed: { backgroundColor: '#F9FAFB' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: { backgroundColor: '#FEE2E2' },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  menuLabelDestructive: { color: '#EF4444' },
});
