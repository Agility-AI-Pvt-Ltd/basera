import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { usePets } from '@/hooks/usePets';
import { usePetTraining } from '@/hooks/usePetTraining';
import type { PetsStackParamList } from '@/src/navigation/types';
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

type Nav = NativeStackNavigationProp<PetsStackParamList, 'TrainingPreferences'>;
type Route = RouteProp<PetsStackParamList, 'TrainingPreferences'>;

export default function TrainingPreferencesScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { getPet } = usePets();
  const [pet, setPet] = useState<Awaited<ReturnType<typeof getPet>>>(null);
  const training = usePetTraining(params.petId, pet);

  const [categories, setCategories] = useState<TrainingCategory[]>([]);
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
  const [regenerate, setRegenerate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getPet(params.petId).then(setPet);
  }, [getPet, params.petId]);

  useEffect(() => {
    if (!training.preferences) return;
    const p = training.preferences;
    setCategories(p.categories);
    setExperience(p.experience);
    setGoals(p.goals);
    setEnvironment(p.environment ?? 'apartment');
    setHasOutdoorSpace(p.hasOutdoorSpace);
    setHasOtherPets(p.hasOtherPets);
    setHasChildren(p.hasChildren);
    setActivityLevel(p.activityLevel ?? 'moderate');
    setDailyTimeMinutes(p.dailyTimeMinutes);
    setPreferredTime(p.preferredTime ?? 'flexible');
    setDifficulty(p.difficulty);
  }, [training.preferences]);

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

  const handleSave = async () => {
    if (categories.length === 0) {
      setError('Pick at least one training category.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const prefs = await training.savePreferences(buildInput(), true);
      if (regenerate) await training.generatePlan(prefs);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences');
    } finally {
      setLoading(false);
    }
  };

  if (!training.isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  return (
    <SignupShell
      title="Training preferences"
      subtitle="Update focus areas and daily training settings"
      showBack
      onBack={() => navigation.goBack()}
      footer={
        <View style={{ gap: 10 }}>
          <Pressable style={styles.regenRow} onPress={() => setRegenerate((v) => !v)}>
            <View style={[styles.checkbox, regenerate && styles.checkboxOn]}>
              {regenerate ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.regenText}>Update my training plan after saving</Text>
          </Pressable>
          <PrimaryButton label="Save changes" onPress={handleSave} disabled={loading} />
        </View>
      }>
      <Text style={styles.label}>Training categories</Text>
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

      <Text style={[styles.label, { marginTop: 16 }]}>Goals</Text>
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

      <Text style={[styles.label, { marginTop: 16 }]}>Daily training time</Text>
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

      <Text style={[styles.label, { marginTop: 16 }]}>Difficulty</Text>
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

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#7C3AED" style={{ marginTop: 16 }} /> : null}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '600', color: '#111827' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
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
  regenRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#7C3AED' },
  checkMark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  regenText: { flex: 1, fontSize: 14, color: '#374151' },
  error: { color: '#EF4444', marginTop: 12 },
});
