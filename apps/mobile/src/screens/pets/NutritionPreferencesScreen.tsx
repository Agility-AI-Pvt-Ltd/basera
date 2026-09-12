import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { usePetNutrition } from '@/hooks/usePetNutrition';
import { usePets } from '@/hooks/usePets';
import type { PetsStackParamList } from '@/src/navigation/types';
import type {
  DietType,
  DietaryRestriction,
  NutritionGoal,
  NutritionPreferencesInput,
  TreatFrequency,
} from '@/types/nutrition';
import {
  DIET_TYPE_OPTIONS,
  MEALS_PER_DAY_OPTIONS,
  NUTRITION_GOAL_OPTIONS,
  RESTRICTION_OPTIONS,
  TREAT_FREQUENCY_OPTIONS,
  defaultFeedingTimes,
  formatFeedingTime,
} from '@/types/nutrition';

type Nav = NativeStackNavigationProp<PetsStackParamList, 'NutritionPreferences'>;
type Route = RouteProp<PetsStackParamList, 'NutritionPreferences'>;

export default function NutritionPreferencesScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { getPet } = usePets();
  const [pet, setPet] = useState<Awaited<ReturnType<typeof getPet>>>(null);
  const nutrition = usePetNutrition(params.petId, pet);

  const [goal, setGoal] = useState<NutritionGoal>('general_health');
  const [dietTypes, setDietTypes] = useState<DietType[]>([]);
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(['none']);
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [feedingTimes, setFeedingTimes] = useState<string[]>(defaultFeedingTimes(2));
  const [treatFrequency, setTreatFrequency] = useState<TreatFrequency>('moderate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getPet(params.petId).then(setPet);
  }, [getPet, params.petId]);

  useEffect(() => {
    if (!nutrition.preferences) return;
    const p = nutrition.preferences;
    setGoal(p.goal);
    setDietTypes(p.dietTypes);
    setRestrictions(p.restrictions);
    setMealsPerDay(p.mealsPerDay);
    setFeedingTimes(p.feedingTimes);
    setTreatFrequency(p.treatFrequency ?? 'moderate');
  }, [nutrition.preferences]);

  const toggle = <T extends string>(list: T[], value: T, setter: (next: T[]) => void) => {
    if (value === 'none') {
      setter(['none' as T]);
      return;
    }
    const next = list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list.filter((v) => v !== 'none'), value];
    setter(next.length ? next : (['none'] as T[]));
  };

  const buildInput = (): NutritionPreferencesInput => ({
    goal,
    dietTypes,
    restrictions,
    allergyIngredients: nutrition.preferences?.allergyIngredients ?? [],
    mealsPerDay,
    feedingTimes,
    treatFrequency,
    portionMeasured: nutrition.preferences?.portionMeasured ?? true,
    typicalPortionGrams: nutrition.preferences?.typicalPortionGrams ?? null,
    waterAccess: nutrition.preferences?.waterAccess ?? null,
    feedingLocation: nutrition.preferences?.feedingLocation ?? null,
    activityLevel: nutrition.preferences?.activityLevel ?? null,
  });

  const promptRegenerate = (prefs: Awaited<ReturnType<typeof nutrition.savePreferences>>) => {
    const run = async (regenerate: boolean) => {
      setLoading(true);
      try {
        if (regenerate && pet) await nutrition.generatePlan(prefs, pet);
        navigation.goBack();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not update plan');
      } finally {
        setLoading(false);
      }
    };

    const message = 'Your nutrition preferences changed. Would you like to update your nutrition plan? Historical logs will be kept.';
    if (Platform.OS === 'web') {
      if (window.confirm(`${message}\n\nOK = Update plan, Cancel = Keep current plan`)) {
        void run(true);
      } else {
        void run(false);
      }
      return;
    }

    Alert.alert('Update nutrition plan?', message, [
      { text: 'Keep current plan', style: 'cancel', onPress: () => void run(false) },
      { text: 'Update plan', onPress: () => void run(true) },
    ]);
  };

  const handleSave = async () => {
    if (dietTypes.length === 0) {
      setError('Select at least one diet type.');
      return;
    }
    setError('');
    try {
      const prefs = await nutrition.savePreferences(buildInput(), true);
      promptRegenerate(prefs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences');
    }
  };

  if (!nutrition.isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#65A30D" />
      </View>
    );
  }

  return (
    <SignupShell
      title="Nutrition preferences"
      subtitle="Update goals, diet, and feeding schedule"
      showBack
      onBack={() => navigation.goBack()}
      footer={<PrimaryButton label="Save changes" onPress={handleSave} disabled={loading} />}>
      <Text style={styles.label}>Goal</Text>
      <View style={styles.chips}>
        {NUTRITION_GOAL_OPTIONS.map((item) => (
          <Chip key={item.id} label={item.label} active={goal === item.id} onPress={() => setGoal(item.id)} />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>Current diet</Text>
      <View style={styles.chips}>
        {DIET_TYPE_OPTIONS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            active={dietTypes.includes(item.id)}
            onPress={() => toggle(dietTypes, item.id, setDietTypes)}
          />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>Dietary restrictions</Text>
      <View style={styles.chips}>
        {RESTRICTION_OPTIONS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            active={restrictions.includes(item.id)}
            onPress={() => toggle(restrictions, item.id, setRestrictions)}
          />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>Meals per day</Text>
      <View style={styles.chips}>
        {MEALS_PER_DAY_OPTIONS.map((n) => (
          <Chip
            key={n}
            label={n >= 4 ? '4+' : String(n)}
            active={mealsPerDay === n}
            onPress={() => {
              setMealsPerDay(n);
              setFeedingTimes(defaultFeedingTimes(n));
            }}
          />
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 16 }]}>Feeding times</Text>
      {feedingTimes.map((time, idx) => (
        <Text key={idx} style={styles.timeLine}>
          Meal {idx + 1}: {formatFeedingTime(time)}
        </Text>
      ))}

      <Text style={[styles.label, { marginTop: 16 }]}>Treat frequency</Text>
      <View style={styles.chips}>
        {TREAT_FREQUENCY_OPTIONS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            active={treatFrequency === item.id}
            onPress={() => setTreatFrequency(item.id)}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#65A30D" style={{ marginTop: 16 }} /> : null}
    </SignupShell>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
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
  chipActive: { backgroundColor: '#ECFCCB', borderColor: '#65A30D' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: '#3F6212', fontWeight: '600' },
  timeLine: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  error: { color: '#EF4444', marginTop: 12 },
});
