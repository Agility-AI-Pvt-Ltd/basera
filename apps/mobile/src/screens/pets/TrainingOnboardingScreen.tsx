import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { usePets } from '@/hooks/usePets';
import { usePetTraining } from '@/hooks/usePetTraining';
import type { PetsStackParamList } from '@/src/navigation/types';
import { computePetAge, formatGender } from '@/types/pet';
import type { ActivityLevel } from '@/types/pet';
import type {
  PreferredTrainingTime,
  TrainingCategory,
  TrainingDifficulty,
  TrainingEnvironment,
  TrainingExperience,
  TrainingGoal,
  TrainingPreferencesInput,
} from '@/types/training';
import {
  DAILY_TIME_OPTIONS,
  DIFFICULTY_OPTIONS,
  EXPERIENCE_OPTIONS,
  TRAINING_CATEGORY_OPTIONS,
  TRAINING_GOAL_OPTIONS,
} from '@/types/training';

type Nav = NativeStackNavigationProp<PetsStackParamList, 'TrainingOnboarding'>;
type Route = RouteProp<PetsStackParamList, 'TrainingOnboarding'>;

const STEPS = ['Focus areas', 'Behavior', 'Environment', 'Preferences', 'Review'];

export default function TrainingOnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { getPet } = usePets();
  const [pet, setPet] = useState<Awaited<ReturnType<typeof getPet>>>(null);
  const training = usePetTraining(params.petId, pet);

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<TrainingCategory[]>(['indoor']);
  const [experience, setExperience] = useState<TrainingExperience>('beginner');
  const [goals, setGoals] = useState<TrainingGoal[]>([]);
  const [environment, setEnvironment] = useState<TrainingEnvironment>('apartment');
  const [hasOutdoorSpace, setHasOutdoorSpace] = useState<boolean | null>(false);
  const [hasOtherPets, setHasOtherPets] = useState<boolean | null>(false);
  const [hasChildren, setHasChildren] = useState<boolean | null>(false);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [dailyTimeMinutes, setDailyTimeMinutes] = useState<number>(15);
  const [preferredTime, setPreferredTime] = useState<PreferredTrainingTime>('flexible');
  const [difficulty, setDifficulty] = useState<TrainingDifficulty>('beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getPet(params.petId).then(setPet);
  }, [getPet, params.petId]);

  const toggle = <T extends string>(list: T[], value: T, setter: (next: T[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const buildInput = (): TrainingPreferencesInput => ({
    categories,
    goals,
    experience,
    dailyTimeMinutes,
    difficulty,
    environment,
    hasOutdoorSpace,
    hasOtherPets,
    hasChildren,
    activityLevel,
    preferredTime,
  });

  const handleNext = async () => {
    if (step === 0 && categories.length === 0) {
      setError('Pick at least one training focus.');
      return;
    }
    setError('');
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    try {
      let activePet = pet;
      if (!activePet) {
        activePet = await getPet(params.petId);
        setPet(activePet);
        if (!activePet) throw new Error('Pet not found');
      }
      const prefs = await training.savePreferences(buildInput(), true);
      await training.generatePlan(prefs, activePet);
      navigation.replace('PetDetail', { petId: params.petId, initialTab: 'training' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create training plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupShell
      title={STEPS[step]}
      subtitle={`Step ${step + 1} of ${STEPS.length} — build a plan for ${pet?.name ?? 'your pet'}`}
      showBack
      onBack={() => (step > 0 ? setStep((s) => s - 1) : navigation.goBack())}
      footer={
        <PrimaryButton
          label={step === STEPS.length - 1 ? 'Generate My Training Plan' : 'Continue'}
          onPress={handleNext}
          disabled={loading}
        />
      }>
      {loading ? <ActivityIndicator color="#7C3AED" style={{ marginVertical: 24 }} /> : null}

      {step === 0 ? (
        <View style={styles.block}>
          <Text style={styles.label}>What do you want to train?</Text>
          <View style={styles.chips}>
            {TRAINING_CATEGORY_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                label={`${item.emoji} ${item.label}`}
                active={categories.includes(item.id)}
                onPress={() => toggle(categories, item.id, setCategories)}
              />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Experience level</Text>
          <View style={styles.chips}>
            {EXPERIENCE_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={experience === item.id}
                onPress={() => setExperience(item.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.block}>
          <Text style={styles.label}>What problems are you experiencing?</Text>
          <View style={styles.chips}>
            {TRAINING_GOAL_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={goals.includes(item.id)}
                onPress={() => toggle(goals, item.id, setGoals)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.block}>
          <Text style={styles.label}>Environment</Text>
          <View style={styles.chips}>
            <Chip label="Apartment" active={environment === 'apartment'} onPress={() => setEnvironment('apartment')} />
            <Chip label="House" active={environment === 'house'} onPress={() => setEnvironment('house')} />
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Has outdoor space?</Text>
          <View style={styles.chips}>
            <Chip label="Yes" active={hasOutdoorSpace === true} onPress={() => setHasOutdoorSpace(true)} />
            <Chip label="No" active={hasOutdoorSpace === false} onPress={() => setHasOutdoorSpace(false)} />
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Other pets at home?</Text>
          <View style={styles.chips}>
            <Chip label="Yes" active={hasOtherPets === true} onPress={() => setHasOtherPets(true)} />
            <Chip label="No" active={hasOtherPets === false} onPress={() => setHasOtherPets(false)} />
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Children at home?</Text>
          <View style={styles.chips}>
            <Chip label="Yes" active={hasChildren === true} onPress={() => setHasChildren(true)} />
            <Chip label="No" active={hasChildren === false} onPress={() => setHasChildren(false)} />
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Typical daily activity level</Text>
          <View style={styles.chips}>
            {(['low', 'moderate', 'high', 'very_high'] as ActivityLevel[]).map((level) => (
              <Chip
                key={level}
                label={level.replace('_', ' ')}
                active={activityLevel === level}
                onPress={() => setActivityLevel(level)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.block}>
          <Text style={styles.label}>Time available per day</Text>
          <View style={styles.chips}>
            {DAILY_TIME_OPTIONS.map((mins) => (
              <Chip
                key={mins}
                label={mins >= 30 ? '30+ min' : `${mins} min`}
                active={dailyTimeMinutes === mins}
                onPress={() => setDailyTimeMinutes(mins)}
              />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Preferred training time</Text>
          <View style={styles.chips}>
            {(['morning', 'afternoon', 'evening', 'flexible'] as PreferredTrainingTime[]).map((time) => (
              <Chip
                key={time}
                label={time.charAt(0).toUpperCase() + time.slice(1)}
                active={preferredTime === time}
                onPress={() => setPreferredTime(time)}
              />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Training difficulty</Text>
          <View style={styles.chips}>
            {DIFFICULTY_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={difficulty === item.id}
                onPress={() => setDifficulty(item.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      {step === 4 && pet ? (
        <View style={styles.reviewCard}>
          <Text style={styles.reviewTitle}>{pet.name}&apos;s profile</Text>
          <Text style={styles.reviewLine}>Type: {pet.species}</Text>
          <Text style={styles.reviewLine}>Breed: {pet.breed || '—'}</Text>
          <Text style={styles.reviewLine}>Age: {computePetAge(pet.birthDate)}</Text>
          <Text style={styles.reviewLine}>Gender: {formatGender(pet.gender)}</Text>
          <Text style={styles.reviewLine}>Weight: {pet.weightKg != null ? `${pet.weightKg} kg` : '—'}</Text>
          <Text style={[styles.reviewLine, { marginTop: 12 }]}>
            Focus: {categories.length} areas · {dailyTimeMinutes} min/day · {difficulty}
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SignupShell>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { gap: 8 },
  label: { fontSize: 15, fontWeight: '600', color: '#111827' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: '#5B21B6', fontWeight: '600' },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8 },
  reviewLine: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  error: { color: '#EF4444', marginTop: 12 },
});
