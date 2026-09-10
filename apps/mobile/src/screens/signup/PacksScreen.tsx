import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { SignupStackParamList } from '@/src/navigation/types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { BRAND_PURPLE, PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { SUGGESTED_PACKS } from '@/constants/signup';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useUserProfile } from '@/hooks/useUserProfile';

type Nav = NativeStackNavigationProp<SignupStackParamList, 'Packs'>;

export default function PacksScreen() {
  const navigation = useNavigation<Nav>();
  const { isReady: authReady } = useAuthStatus();
  const { isReady, profile, updateProfile } = useUserProfile();
  const [selected, setSelected] = useState<string[]>(profile?.selectedPackIds ?? []);

  const redirectTo =
    isReady && profile
      ? profile.hasDog === null || profile.hasDog === undefined
        ? ('DogFork' as const)
        : profile.hasDog && !profile.pet?.name
          ? ('PetProfile' as const)
          : !profile.hasDog && !profile.adoptionSetupDone
            ? ('AdoptionSetup' as const)
            : null
      : null;

  useEffect(() => {
    if (redirectTo) {
      navigation.navigate(redirectTo);
    }
  }, [redirectTo, navigation]);

  if (!authReady || !isReady || redirectTo) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BRAND_PURPLE} />
      </View>
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBack = async () => {
    if (profile?.hasDog) {
      navigation.navigate('PetProfile');
      return;
    }
    await updateProfile({ adoptionSetupDone: false });
    navigation.navigate('AdoptionSetup');
  };

  const finish = async () => {
    await updateProfile({
      selectedPackIds: selected,
      signupComplete: true,
    });
    // App.tsx gate switches to MainTabs when signupComplete flips.
  };

  return (
    <SignupShell
      title="Packs near you"
      subtitle="Both paths land here — join a few local packs to get started. You can change this later."
      showBack
      onBack={handleBack}
      footer={<PrimaryButton label="Enter Basera" onPress={finish} />}>
      {SUGGESTED_PACKS.map((pack) => {
        const active = selected.includes(pack.id);
        return (
          <Pressable
            key={pack.id}
            onPress={() => toggle(pack.id)}
            style={[styles.card, active && styles.cardActive]}>
            <View style={styles.cardIcon}>
              <FontAwesome name="users" size={20} color={BRAND_PURPLE} />
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{pack.name}</Text>
              <Text style={styles.cardMeta}>
                {pack.area} · {pack.members} members
              </Text>
            </View>
            <View style={[styles.check, active && styles.checkActive]}>
              {active ? <FontAwesome name="check" size={12} color="#FFFFFF" /> : null}
            </View>
          </Pressable>
        );
      })}
    </SignupShell>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  cardActive: {
    borderColor: BRAND_PURPLE,
    backgroundColor: '#F5F3FF',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '200',
    color: '#111827',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: BRAND_PURPLE,
    borderColor: BRAND_PURPLE,
  },
});
