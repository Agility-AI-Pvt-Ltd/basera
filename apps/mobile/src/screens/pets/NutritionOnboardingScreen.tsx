import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton, SignupShell } from '@/components/SignupShell';
import { Text } from '@/components/Themed';
import { usePets } from '@/hooks/usePets';
import { usePetNutrition } from '@/hooks/usePetNutrition';
import type { PetsStackParamList } from '@/src/navigation/types';
import { computePetAge, formatGender } from '@/types/pet';
import type { ActivityLevel } from '@/types/pet';
import type {
  DietType,
  DietaryRestriction,
  NutritionGoal,
  NutritionPreferencesInput,
  PetFoodInput,
  TreatFrequency,
} from '@/types/nutrition';
import {
  ALLERGY_INGREDIENTS,
  DIET_TYPE_OPTIONS,
  MEALS_PER_DAY_OPTIONS,
  NUTRITION_GOAL_OPTIONS,
  RESTRICTION_OPTIONS,
  TREAT_FREQUENCY_OPTIONS,
  defaultFeedingTimes,
} from '@/types/nutrition';

type Nav = NativeStackNavigationProp<PetsStackParamList, 'NutritionOnboarding'>;
type Route = RouteProp<PetsStackParamList, 'NutritionOnboarding'>;

const STEPS = ['Basic info', 'Preferences', 'Feeding routine', 'Current food', 'Create plan'];

export default function NutritionOnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { getPet } = usePets();
  const [pet, setPet] = useState<Awaited<ReturnType<typeof getPet>>>(null);
  const nutrition = usePetNutrition(params.petId, pet);

  const [step, setStep] = useState(0);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [dietTypes, setDietTypes] = useState<DietType[]>(['dry_food']);
  const [goal, setGoal] = useState<NutritionGoal>('general_health');
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>(['none']);
  const [allergyIngredients, setAllergyIngredients] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [feedingTimes, setFeedingTimes] = useState<string[]>(defaultFeedingTimes(2));
  const [treatFrequency, setTreatFrequency] = useState<TreatFrequency>('moderate');
  const [typicalPortionGrams, setTypicalPortionGrams] = useState('');
  const [portionMeasured, setPortionMeasured] = useState(true);
  const [foodsDraft, setFoodsDraft] = useState<PetFoodInput[]>([]);
  const [foodName, setFoodName] = useState('');
  const [foodBrand, setFoodBrand] = useState('');
  const [foodType, setFoodType] = useState<DietType>('dry_food');
  const [foodQuantity, setFoodQuantity] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void getPet(params.petId).then(setPet);
  }, [getPet, params.petId]);

  const toggle = <T extends string>(list: T[], value: T, setter: (next: T[]) => void) => {
    if (value === 'none' && list.includes('none' as T)) return;
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
    allergyIngredients,
    mealsPerDay,
    feedingTimes,
    treatFrequency,
    portionMeasured,
    typicalPortionGrams: typicalPortionGrams.trim() ? Number(typicalPortionGrams) : null,
    waterAccess: null,
    feedingLocation: null,
    activityLevel,
  });

  const addFoodDraft = () => {
    if (!foodName.trim()) {
      setError('Enter a food name.');
      return;
    }
    setFoodsDraft((prev) => [
      ...prev,
      {
        name: foodName.trim(),
        brand: foodBrand.trim() || undefined,
        foodType,
        quantity: foodQuantity.trim() ? Number(foodQuantity) : null,
        unit: 'grams',
      },
    ]);
    setFoodName('');
    setFoodBrand('');
    setFoodQuantity('');
    setError('');
  };

  const runGenerate = async () => {
    setGenerating(true);
    setGenStep(0);
    const steps = ['Age', 'Breed', 'Weight', 'Activity', 'Feeding routine', 'Dietary preferences'];
    for (let i = 0; i < steps.length; i++) {
      setGenStep(i);
      await new Promise((r) => setTimeout(r, 400));
    }
    try {
      let activePet = pet;
      if (!activePet) {
        activePet = await getPet(params.petId);
        setPet(activePet);
        if (!activePet) throw new Error('Pet not found');
      }
      const prefs = await nutrition.savePreferences(buildInput(), true);
      const savedFoods = [];
      for (const food of foodsDraft) {
        savedFoods.push(await nutrition.addFood(food));
      }
      await nutrition.generatePlan(prefs, activePet, savedFoods);
      navigation.replace('PetDetail', { petId: params.petId, initialTab: 'nutrition' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create nutrition plan');
      setGenerating(false);
    }
  };

  const handleNext = async () => {
    setError('');
    if (step === 1 && dietTypes.length === 0) {
      setError('Select at least one diet type.');
      return;
    }
    if (step < STEPS.length - 1) {
      if (step === 2) {
        setFeedingTimes(defaultFeedingTimes(mealsPerDay));
      }
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    await runGenerate();
    setLoading(false);
  };

  return (
    <SignupShell
      title={STEPS[step]}
      subtitle={`Step ${step + 1} of ${STEPS.length} · nutrition plan for ${pet?.name ?? 'your pet'}`}
      showBack
      onBack={() => (step > 0 && !generating ? setStep((s) => s - 1) : navigation.goBack())}
      footer={
        step < STEPS.length - 1 ? (
          <PrimaryButton label="Continue" onPress={handleNext} disabled={loading || generating} />
        ) : (
          <PrimaryButton
            label="Generate My Nutrition Plan"
            onPress={handleNext}
            disabled={loading || generating}
          />
        )
      }>
      {step === 0 && pet ? (
        <View style={styles.block}>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>From {pet.name}&apos;s profile</Text>
            <Text style={styles.reviewLine}>Type: {pet.species}</Text>
            <Text style={styles.reviewLine}>Breed: {pet.breed || '—'}</Text>
            <Text style={styles.reviewLine}>Age: {computePetAge(pet.birthDate)}</Text>
            <Text style={styles.reviewLine}>Sex: {formatGender(pet.gender)}</Text>
            <Text style={styles.reviewLine}>Weight: {pet.weightKg != null ? `${pet.weightKg} kg` : '—'}</Text>
          </View>
          <Text style={styles.label}>Typical daily activity level</Text>
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

      {step === 1 ? (
        <View style={styles.block}>
          <Text style={styles.label}>What does {pet?.name ?? 'your pet'} currently eat?</Text>
          <View style={styles.chips}>
            {DIET_TYPE_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                label={`${item.emoji} ${item.label}`}
                active={dietTypes.includes(item.id)}
                onPress={() => toggle(dietTypes, item.id, setDietTypes)}
              />
            ))}
          </View>
          <Text style={[styles.label, { marginTop: 16 }]}>Main nutrition goal</Text>
          <View style={styles.chips}>
            {NUTRITION_GOAL_OPTIONS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={goal === item.id}
                onPress={() => setGoal(item.id)}
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
          {restrictions.some((r) => ['allergies', 'ingredients_avoid'].includes(r)) ? (
            <>
              <Text style={[styles.label, { marginTop: 12 }]}>Ingredients to avoid</Text>
              <View style={styles.chips}>
                {ALLERGY_INGREDIENTS.map((item) => (
                  <Chip
                    key={item}
                    label={item}
                    active={allergyIngredients.includes(item)}
                    onPress={() => toggle(allergyIngredients, item, setAllergyIngredients)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.block}>
          <Text style={styles.label}>How many meals per day?</Text>
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
          <Text style={[styles.label, { marginTop: 16 }]}>Typical feeding times</Text>
          {feedingTimes.map((time, idx) => (
            <View key={idx} style={styles.timeRow}>
              <Text style={styles.timeLabel}>Meal {idx + 1}</Text>
              <TextInput
                value={time}
                onChangeText={(v) => {
                  const next = [...feedingTimes];
                  next[idx] = v;
                  setFeedingTimes(next);
                }}
                placeholder="08:00"
                style={styles.timeInput}
              />
            </View>
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
          <Text style={[styles.label, { marginTop: 16 }]}>Typical daily portion (grams, optional)</Text>
          <TextInput
            value={typicalPortionGrams}
            onChangeText={setTypicalPortionGrams}
            keyboardType="number-pad"
            placeholder="e.g. 300"
            style={styles.input}
          />
          <Pressable style={styles.checkRow} onPress={() => setPortionMeasured((v) => !v)}>
            <View style={[styles.checkbox, portionMeasured && styles.checkboxOn]}>
              {portionMeasured ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>I measure portions with a scale or cup</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.block}>
          <Text style={styles.label}>Record current foods (optional but helpful)</Text>
          {foodsDraft.map((food, idx) => (
            <View key={idx} style={styles.foodCard}>
              <Text style={styles.foodTitle}>🥣 {food.name}</Text>
              <Text style={styles.foodMeta}>
                {food.foodType.replace('_', ' ')}
                {food.quantity ? ` · ${food.quantity}g/day` : ''}
              </Text>
            </View>
          ))}
          <TextInput value={foodName} onChangeText={setFoodName} placeholder="Food name" style={styles.input} />
          <TextInput value={foodBrand} onChangeText={setFoodBrand} placeholder="Brand (optional)" style={styles.input} />
          <View style={styles.chips}>
            {DIET_TYPE_OPTIONS.slice(0, 4).map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                active={foodType === item.id}
                onPress={() => setFoodType(item.id)}
              />
            ))}
          </View>
          <TextInput
            value={foodQuantity}
            onChangeText={setFoodQuantity}
            keyboardType="number-pad"
            placeholder="Daily amount in grams"
            style={styles.input}
          />
          <Pressable style={styles.addFoodBtn} onPress={addFoodDraft}>
            <Text style={styles.addFoodText}>+ Add food</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.block}>
          {generating ? (
            <>
              <Text style={styles.genTitle}>Creating {pet?.name}&apos;s nutrition plan…</Text>
              {['Age', 'Breed', 'Weight', 'Activity', 'Feeding routine', 'Dietary preferences'].map(
                (label, idx) => (
                  <View key={label} style={styles.genRow}>
                    <Text style={styles.genLabel}>
                      {idx <= genStep ? '✓' : '○'} {label}
                    </Text>
                  </View>
                ),
              )}
              <ActivityIndicator color="#7C3AED" style={{ marginTop: 16 }} />
            </>
          ) : (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Ready to generate</Text>
              <Text style={styles.reviewLine}>{mealsPerDay} meals/day · {dietTypes.length} diet types</Text>
              <Text style={styles.reviewLine}>Goal: {NUTRITION_GOAL_OPTIONS.find((g) => g.id === goal)?.label}</Text>
              <Text style={styles.reviewLine}>{foodsDraft.length} food(s) recorded</Text>
              <Text style={[styles.hint, { marginTop: 12 }]}>
                Targets are estimates for guidance only — not veterinary advice.
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  chipActive: { backgroundColor: '#ECFCCB', borderColor: '#65A30D' },
  chipText: { fontSize: 14, color: '#374151' },
  chipTextActive: { color: '#3F6212', fontWeight: '600' },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8 },
  reviewLine: { fontSize: 14, color: '#4B5563', marginTop: 4 },
  hint: { fontSize: 12, color: '#78716C', lineHeight: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeLabel: { width: 60, fontSize: 14, color: '#6B7280' },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#65A30D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#65A30D' },
  checkMark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: 14, color: '#374151' },
  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  foodTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  foodMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  addFoodBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#ECFCCB',
  },
  addFoodText: { color: '#3F6212', fontWeight: '600' },
  genTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  genRow: { marginTop: 8 },
  genLabel: { fontSize: 15, color: '#374151' },
  error: { color: '#EF4444', marginTop: 12 },
});
