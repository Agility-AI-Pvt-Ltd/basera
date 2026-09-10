import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { SignupStackParamList } from '@/src/navigation/types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
  BRAND_PURPLE,
  PrimaryButton,
  SignupShell,
  SkipButton,
} from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useUserProfile } from '@/hooks/useUserProfile';

const HOME_TYPES = ['Apartment', 'Independent house', 'Farm / open land'] as const;

type Nav = NativeStackNavigationProp<SignupStackParamList, 'AdoptionSetup'>;

export default function AdoptionSetupScreen() {
  const navigation = useNavigation<Nav>();
  const { isReady: authReady } = useAuthStatus();
  const { isReady, profile, updateProfile } = useUserProfile();
  const [homeType, setHomeType] = useState<string | null>(null);
  const [hasKids, setHasKids] = useState<boolean | null>(null);
  const [hasOtherPets, setHasOtherPets] = useState<boolean | null>(null);

  const needsDogFork = isReady && profile?.hasDog !== false;

  useEffect(() => {
    if (needsDogFork) {
      navigation.navigate('DogFork');
    }
  }, [needsDogFork, navigation]);

  if (!authReady || !isReady || needsDogFork) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BRAND_PURPLE} />
      </View>
    );
  }

  const handleBack = async () => {
    await updateProfile({ hasDog: null, adoptionSetupDone: false });
    navigation.navigate('DogFork');
  };

  const finish = async () => {
    await updateProfile({ adoptionSetupDone: true });
    navigation.navigate('Packs');
  };

  return (
    <SignupShell
      title="Adoption browsing setup"
      subtitle="Optional preferences — skip anytime and fill these when you start applying."
      showBack
      onBack={handleBack}
      footer={
        <>
          <PrimaryButton label="Continue" onPress={finish} />
          <SkipButton label="Skip for now" onPress={finish} />
        </>
      }>
      <Text style={styles.sectionLabel}>Home type</Text>
      <View style={styles.chips}>
        {HOME_TYPES.map((type) => (
          <Pressable
            key={type}
            onPress={() => setHomeType(type)}
            style={[styles.chip, homeType === type && styles.chipActive]}>
            <Text style={[styles.chipText, homeType === type && styles.chipTextActive]}>
              {type}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Kids at home?</Text>
      <View style={styles.row}>
        <ToggleChip label="Yes" active={hasKids === true} onPress={() => setHasKids(true)} />
        <ToggleChip label="No" active={hasKids === false} onPress={() => setHasKids(false)} />
      </View>

      <Text style={styles.sectionLabel}>Other pets?</Text>
      <View style={styles.row}>
        <ToggleChip
          label="Yes"
          active={hasOtherPets === true}
          onPress={() => setHasOtherPets(true)}
        />
        <ToggleChip
          label="No"
          active={hasOtherPets === false}
          onPress={() => setHasOtherPets(false)}
        />
      </View>

      <View style={styles.note}>
        <FontAwesome name="info-circle" size={16} color={BRAND_PURPLE} />
        <Text style={styles.noteText}>
          Adopter preferences matter a lot later — we won&apos;t block signup on a long form.
        </Text>
      </View>
    </SignupShell>
  );
}

function ToggleChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, styles.flexChip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  flexChip: {
    flex: 1,
    alignItems: 'center',
  },
  chipActive: {
    borderColor: BRAND_PURPLE,
    backgroundColor: '#F5F3FF',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextActive: {
    color: BRAND_PURPLE,
  },
  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },
});
