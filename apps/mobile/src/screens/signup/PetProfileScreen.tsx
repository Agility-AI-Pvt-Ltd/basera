import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { SignupStackParamList } from '@/src/navigation/types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import {
  BRAND_PURPLE,
  PrimaryButton,
  SignupShell,
  SkipButton,
} from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { usePets } from '@/hooks/usePets';
import { useUserProfile } from '@/hooks/useUserProfile';

type Nav = NativeStackNavigationProp<SignupStackParamList, 'PetProfile'>;

export default function PetProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { isReady: authReady } = useAuthStatus();
  const { isReady, profile, updateProfile } = useUserProfile();
  const { createPet } = usePets();

  const [name, setName] = useState(profile?.pet?.name ?? '');
  const [breed, setBreed] = useState(profile?.pet?.breed ?? '');
  const [error, setError] = useState('');

  const needsDogFork = isReady && profile?.hasDog !== true;

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
    await updateProfile({ hasDog: null, pet: null });
    navigation.navigate('DogFork');
  };

  const goPacks = () => navigation.navigate('Packs');

  const handleContinue = async () => {
    if (name.trim().length < 1) {
      setError('Give your dog a name to continue, or skip for now.');
      return;
    }
    await updateProfile({
      pet: { name: name.trim(), breed: breed.trim() },
    });
    try {
      await createPet({ name: name.trim(), breed: breed.trim(), species: 'dog' });
    } catch {
      // pets table may not be migrated yet — signup still advances
    }
    goPacks();
  };

  const handleSkip = async () => {
    // Keep a minimal placeholder so the gate advances; user can edit later
    await updateProfile({
      pet: { name: name.trim() || 'My dog', breed: breed.trim() },
    });
    try {
      await createPet({
        name: name.trim() || 'My dog',
        breed: breed.trim(),
        species: 'dog',
      });
    } catch {
      // ignore if migration not applied
    }
    goPacks();
  };

  return (
    <SignupShell
      title="Add your dog"
      subtitle="A quick pet profile so packs and meetups know who to expect."
      showBack
      onBack={handleBack}
      footer={
        <>
          <PrimaryButton label="Continue" onPress={handleContinue} disabled={!name.trim()} />
          <SkipButton label="Skip for now" onPress={handleSkip} />
        </>
      }>
      <View style={styles.field}>
        <Text style={styles.label}>Dog&apos;s name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bruno"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Breed (optional)</Text>
        <TextInput
          value={breed}
          onChangeText={setBreed}
          placeholder="e.g. Indie, Labrador"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          autoCapitalize="words"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  field: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: '#111827',
    padding: 0,
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
  },
});
