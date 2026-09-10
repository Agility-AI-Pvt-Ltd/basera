import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { SignupStackParamList } from '@/src/navigation/types';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { BRAND_PURPLE, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useUserProfile } from '@/hooks/useUserProfile';
import { hasCompletedBasics } from '@/types/profile';

type Nav = NativeStackNavigationProp<SignupStackParamList, 'DogFork'>;

export default function DogForkScreen() {
  const navigation = useNavigation<Nav>();
  const { isReady: authReady } = useAuthStatus();
  const { isReady, profile, updateProfile } = useUserProfile();

  const basicsMissing = isReady && (!profile || !hasCompletedBasics(profile));

  useEffect(() => {
    if (basicsMissing) {
      navigation.navigate('Basics');
    }
  }, [basicsMissing, navigation]);

  if (!authReady || !isReady || basicsMissing) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={BRAND_PURPLE} />
      </View>
    );
  }

  const handleBack = async () => {
    await updateProfile({ hasDog: null, pet: null, adoptionSetupDone: false });
    navigation.navigate('Basics');
  };

  const chooseYes = async () => {
    await updateProfile({ hasDog: true, adoptionSetupDone: true });
    navigation.navigate('PetProfile');
  };

  const chooseNo = async () => {
    await updateProfile({ hasDog: false, pet: null });
    navigation.navigate('AdoptionSetup');
  };

  return (
    <SignupShell
      title="Do you have a dog?"
      subtitle="This one question helps us route you to the right next step."
      showBack
      onBack={handleBack}>
      <Pressable onPress={chooseYes} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
        <View style={styles.iconCircle}>
          <FontAwesome name="paw" size={28} color={BRAND_PURPLE} />
        </View>
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>Yes</Text>
          <Text style={styles.choiceDesc}>Create a pet profile next</Text>
        </View>
        <FontAwesome name="angle-right" size={22} color="#9CA3AF" />
      </Pressable>

      <Pressable onPress={chooseNo} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
        <View style={styles.iconCircle}>
          <FontAwesome name="heart-o" size={26} color={BRAND_PURPLE} />
        </View>
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>No</Text>
          <Text style={styles.choiceDesc}>Set up adoption browsing next</Text>
        </View>
        <FontAwesome name="angle-right" size={22} color="#9CA3AF" />
      </Pressable>
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
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.9,
    borderColor: BRAND_PURPLE,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCopy: {
    flex: 1,
    gap: 2,
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '200',
    color: '#111827',
  },
  choiceDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
});
