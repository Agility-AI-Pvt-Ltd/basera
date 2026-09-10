import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function PetsScreen() {
  const insets = useSafeAreaInsets();
  const { phone, signOut } = useAuthStatus();
  const { profile, resetProfile } = useUserProfile();
  const { resetOnboarding } = useOnboardingStatus();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleResetOnboarding = async () => {
    await signOut();
    await resetOnboarding();
  };

  const handleResetSignup = async () => {
    await resetProfile();
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Pets</Text>
      <Text style={styles.subtitle}>Your pets and account</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Signed in as</Text>
        <Text style={styles.value}>{phone || profile?.name || '—'}</Text>
      </View>

      <Pressable style={styles.action} onPress={handleSignOut}>
        <Feather name="log-out" size={18} color="#111827" />
        <Text style={styles.actionText}>Sign out</Text>
      </Pressable>
      <Pressable style={styles.action} onPress={handleResetSignup}>
        <Feather name="refresh-cw" size={18} color="#111827" />
        <Text style={styles.actionText}>Reset signup</Text>
      </Pressable>
      <Pressable style={styles.action} onPress={handleResetOnboarding}>
        <Feather name="rotate-ccw" size={18} color="#111827" />
        <Text style={styles.actionText}>Replay onboarding</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: '200',
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 24,
    fontSize: 15,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  value: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: '200',
    color: '#111827',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 15,
    color: '#111827',
  },
});
