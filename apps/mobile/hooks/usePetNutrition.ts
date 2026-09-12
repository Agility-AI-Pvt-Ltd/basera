import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  buildPlanSummary,
  generateWeeklyMeals,
  getWeekStart,
} from '@/lib/nutritionPlanGenerator';
import { supabase } from '@/lib/supabase';
import type { Pet } from '@/types/pet';
import type {
  FoodDiaryEntry,
  NutritionPreferencesInput,
  PetFood,
  PetFoodInput,
  PetNutritionMeal,
  PetNutritionPlan,
  PetNutritionPreferences,
  TreatLog,
  WaterLog,
} from '@/types/nutrition';
import { formatFeedingTime } from '@/types/nutrition';

type PreferencesRow = {
  pet_id: string;
  goal: PetNutritionPreferences['goal'];
  diet_types: string[];
  restrictions: string[];
  allergy_ingredients: string[];
  meals_per_day: number;
  feeding_times: string[];
  treat_frequency: PetNutritionPreferences['treatFrequency'];
  portion_measured: boolean;
  typical_portion_grams: number | null;
  water_access: string | null;
  feeding_location: string | null;
  activity_level: PetNutritionPreferences['activityLevel'];
  onboarded: boolean;
};

type FoodRow = {
  id: string;
  pet_id: string;
  name: string;
  brand: string | null;
  food_type: string;
  quantity: number | null;
  unit: string;
  ingredients: string[] | null;
  is_active: boolean;
};

type MealRow = {
  id: string;
  plan_id: string;
  pet_id: string;
  meal_date: string;
  meal_type: PetNutritionMeal['mealType'];
  scheduled_time: string;
  food_id: string | null;
  food_name: string;
  food_type: string;
  planned_quantity: number | null;
  unit: string;
  sort_order: number;
};

type FeedingLogRow = { meal_id: string; fed_at: string; fed: boolean };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapPreferences(row: PreferencesRow): PetNutritionPreferences {
  return {
    petId: row.pet_id,
    goal: row.goal,
    dietTypes: row.diet_types as PetNutritionPreferences['dietTypes'],
    restrictions: row.restrictions as PetNutritionPreferences['restrictions'],
    allergyIngredients: row.allergy_ingredients ?? [],
    mealsPerDay: row.meals_per_day,
    feedingTimes: row.feeding_times ?? [],
    treatFrequency: row.treat_frequency,
    portionMeasured: row.portion_measured,
    typicalPortionGrams: row.typical_portion_grams,
    waterAccess: row.water_access,
    feedingLocation: row.feeding_location,
    activityLevel: row.activity_level,
    onboarded: row.onboarded,
  };
}

function preferencesToRow(petId: string, input: NutritionPreferencesInput, onboarded: boolean) {
  return {
    pet_id: petId,
    goal: input.goal,
    diet_types: input.dietTypes,
    restrictions: input.restrictions,
    allergy_ingredients: input.allergyIngredients,
    meals_per_day: input.mealsPerDay,
    feeding_times: input.feedingTimes,
    treat_frequency: input.treatFrequency,
    portion_measured: input.portionMeasured,
    typical_portion_grams: input.typicalPortionGrams,
    water_access: input.waterAccess,
    feeding_location: input.feedingLocation,
    activity_level: input.activityLevel,
    onboarded,
  };
}

function mapFood(row: FoodRow): PetFood {
  return {
    id: row.id,
    petId: row.pet_id,
    name: row.name,
    brand: row.brand,
    foodType: row.food_type,
    quantity: row.quantity,
    unit: row.unit,
    ingredients: row.ingredients ?? [],
    isActive: row.is_active,
  };
}

function mapMeal(row: MealRow, log?: FeedingLogRow): PetNutritionMeal {
  return {
    id: row.id,
    planId: row.plan_id,
    petId: row.pet_id,
    mealDate: row.meal_date,
    mealType: row.meal_type,
    scheduledTime: row.scheduled_time,
    foodId: row.food_id,
    foodName: row.food_name,
    foodType: row.food_type,
    plannedQuantity: row.planned_quantity,
    unit: row.unit,
    sortOrder: row.sort_order,
    fed: Boolean(log?.fed),
    fedAt: log?.fed_at ?? null,
  };
}

export function usePetNutrition(petId: string | undefined, pet: Pet | null) {
  const [preferences, setPreferences] = useState<PetNutritionPreferences | null>(null);
  const [plan, setPlan] = useState<PetNutritionPlan | null>(null);
  const [foods, setFoods] = useState<PetFood[]>([]);
  const [meals, setMeals] = useState<PetNutritionMeal[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [treatLogs, setTreatLogs] = useState<TreatLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const dayMeals = useMemo(
    () =>
      meals
        .filter((m) => m.mealDate === selectedDate)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [meals, selectedDate],
  );

  const mealsFed = dayMeals.filter((m) => m.fed).length;
  const mealProgress = dayMeals.length > 0 ? mealsFed / dayMeals.length : 0;

  const dayWaterCups = useMemo(
    () => waterLogs.filter((w) => w.logDate === selectedDate).reduce((sum, w) => sum + w.cups, 0),
    [waterLogs, selectedDate],
  );

  const dayTreatCount = useMemo(
    () =>
      treatLogs
        .filter((t) => t.logDate === selectedDate)
        .reduce((sum, t) => sum + t.quantity, 0),
    [treatLogs, selectedDate],
  );

  const foodDiary = useMemo((): FoodDiaryEntry[] => {
    const entries: FoodDiaryEntry[] = [];

    dayMeals.forEach((meal) => {
      entries.push({
        id: meal.id,
        time: formatFeedingTime(meal.scheduledTime),
        kind: 'meal',
        title: meal.foodName,
        subtitle: `${meal.plannedQuantity ?? '—'} ${meal.unit}`,
        completed: meal.fed,
      });
    });

    treatLogs
      .filter((t) => t.logDate === selectedDate)
      .forEach((t) => {
        const d = new Date(t.loggedAt);
        entries.push({
          id: t.id,
          time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
          kind: 'treat',
          title: t.treatName,
          subtitle: `${t.quantity} treat${t.quantity === 1 ? '' : 's'}`,
          completed: true,
        });
      });

    waterLogs
      .filter((w) => w.logDate === selectedDate)
      .forEach((w) => {
        const d = new Date(w.loggedAt);
        entries.push({
          id: w.id,
          time: d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
          kind: 'water',
          title: 'Water',
          subtitle: `${w.cups} cup${w.cups === 1 ? '' : 's'}`,
          completed: true,
        });
      });

    return entries.sort((a, b) => a.time.localeCompare(b.time));
  }, [dayMeals, treatLogs, waterLogs, selectedDate]);

  const loadNutrition = useCallback(async () => {
    if (!petId) return;

    const { data: prefRow } = await supabase
      .from('pet_nutrition_preferences')
      .select('*')
      .eq('pet_id', petId)
      .maybeSingle();
    setPreferences(prefRow ? mapPreferences(prefRow as PreferencesRow) : null);

    const { data: foodRows } = await supabase
      .from('pet_foods')
      .select('*')
      .eq('pet_id', petId)
      .eq('is_active', true)
      .order('created_at');
    setFoods(((foodRows as FoodRow[] | null) ?? []).map(mapFood));

    const { data: planRow } = await supabase
      .from('pet_nutrition_plans')
      .select('*')
      .eq('pet_id', petId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!planRow) {
      setPlan(null);
      setMeals([]);
    } else {
      setPlan({
        id: planRow.id,
        petId: planRow.pet_id,
        isActive: planRow.is_active,
        dailyMeals: planRow.daily_meals,
        mainFoodType: planRow.main_food_type,
        treatLimit: planRow.treat_limit,
        waterGoalCups: planRow.water_goal_cups,
        guidanceNotes: planRow.guidance_notes,
        createdAt: planRow.created_at,
      });

      const { data: mealRows } = await supabase
        .from('pet_nutrition_meals')
        .select('*')
        .eq('plan_id', planRow.id)
        .order('meal_date')
        .order('sort_order');

      const mealIds = ((mealRows as MealRow[] | null) ?? []).map((m) => m.id);
      let feedingLogs: FeedingLogRow[] = [];
      if (mealIds.length) {
        const { data: logRows } = await supabase
          .from('pet_feeding_logs')
          .select('meal_id, fed_at, fed')
          .eq('pet_id', petId)
          .in('meal_id', mealIds);
        feedingLogs = (logRows as FeedingLogRow[] | null) ?? [];
      }
      const logByMeal = new Map(feedingLogs.map((l) => [l.meal_id, l]));
      setMeals(((mealRows as MealRow[] | null) ?? []).map((row) => mapMeal(row, logByMeal.get(row.id))));
    }

    const [{ data: waterRows }, { data: treatRows }] = await Promise.all([
      supabase.from('pet_water_logs').select('*').eq('pet_id', petId).order('logged_at', { ascending: false }),
      supabase.from('pet_treat_logs').select('*').eq('pet_id', petId).order('logged_at', { ascending: false }),
    ]);

    setWaterLogs(
      ((waterRows as { id: string; pet_id: string; log_date: string; cups: number; logged_at: string }[] | null) ?? []).map(
        (r) => ({ id: r.id, petId: r.pet_id, logDate: r.log_date, cups: Number(r.cups), loggedAt: r.logged_at }),
      ),
    );
    setTreatLogs(
      ((treatRows as { id: string; pet_id: string; log_date: string; treat_name: string; quantity: number; logged_at: string }[] | null) ?? []).map(
        (r) => ({
          id: r.id,
          petId: r.pet_id,
          logDate: r.log_date,
          treatName: r.treat_name,
          quantity: r.quantity,
          loggedAt: r.logged_at,
        }),
      ),
    );
  }, [petId]);

  useEffect(() => {
    if (!petId) {
      setIsReady(true);
      return;
    }
    setIsReady(false);
    loadNutrition().finally(() => setIsReady(true));
  }, [petId, loadNutrition]);

  const savePreferences = useCallback(
    async (input: NutritionPreferencesInput, onboarded = true) => {
      if (!petId) throw new Error('Missing pet');
      const { data, error } = await supabase
        .from('pet_nutrition_preferences')
        .upsert(preferencesToRow(petId, input, onboarded), { onConflict: 'pet_id' })
        .select('*')
        .single();
      if (error) throw error;
      const mapped = mapPreferences(data as PreferencesRow);
      setPreferences(mapped);
      return mapped;
    },
    [petId],
  );

  const addFood = useCallback(
    async (input: PetFoodInput) => {
      if (!petId) throw new Error('Missing pet');
      const { data, error } = await supabase
        .from('pet_foods')
        .insert({
          pet_id: petId,
          name: input.name.trim(),
          brand: input.brand?.trim() || null,
          food_type: input.foodType,
          quantity: input.quantity ?? null,
          unit: input.unit ?? 'grams',
          ingredients: input.ingredients ?? [],
        })
        .select('*')
        .single();
      if (error) throw error;
      const food = mapFood(data as FoodRow);
      setFoods((prev) => [...prev, food]);
      return food;
    },
    [petId],
  );

  const generatePlan = useCallback(
    async (prefs?: PetNutritionPreferences, petOverride?: Pet, foodList?: PetFood[]) => {
      const activePet = petOverride ?? pet;
      const activePrefs = prefs ?? preferences;
      const activeFoods = foodList ?? foods;
      if (!petId || !activePet || !activePrefs) throw new Error('Missing data for plan');

      setLoading(true);
      try {
        await supabase
          .from('pet_nutrition_plans')
          .update({ is_active: false })
          .eq('pet_id', petId)
          .eq('is_active', true);

        const summary = buildPlanSummary(activePet, activePrefs, activeFoods);
        const { data: planRow, error: planError } = await supabase
          .from('pet_nutrition_plans')
          .insert({
            pet_id: petId,
            is_active: true,
            daily_meals: summary.dailyMeals,
            main_food_type: summary.mainFoodType,
            treat_limit: summary.treatLimit,
            water_goal_cups: summary.waterGoalCups,
            guidance_notes: summary.guidanceNotes,
          })
          .select('*')
          .single();
        if (planError) throw planError;

        const weekStart = getWeekStart();
        const generated = generateWeeklyMeals(activePet, activePrefs, activeFoods, weekStart);
        if (generated.length) {
          const { error: mealError } = await supabase.from('pet_nutrition_meals').insert(
            generated.map((m) => ({
              plan_id: planRow.id,
              pet_id: petId,
              meal_date: m.mealDate,
              meal_type: m.mealType,
              scheduled_time: m.scheduledTime,
              food_id: m.foodId,
              food_name: m.foodName,
              food_type: m.foodType,
              planned_quantity: m.plannedQuantity,
              unit: m.unit,
              sort_order: m.sortOrder,
            })),
          );
          if (mealError) throw mealError;
        }

        await loadNutrition();
      } finally {
        setLoading(false);
      }
    },
    [petId, pet, preferences, foods, loadNutrition],
  );

  const toggleMealFed = useCallback(
    async (mealId: string, fed: boolean) => {
      if (!petId) return;
      const meal = meals.find((m) => m.id === mealId);
      if (!meal) return;

      if (fed) {
        const { error } = await supabase.from('pet_feeding_logs').upsert(
          { meal_id: mealId, pet_id: petId, log_date: meal.mealDate, fed: true },
          { onConflict: 'meal_id,log_date' },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pet_feeding_logs')
          .delete()
          .eq('meal_id', mealId)
          .eq('log_date', meal.mealDate);
        if (error) throw error;
      }

      setMeals((prev) =>
        prev.map((m) =>
          m.id === mealId
            ? { ...m, fed, fedAt: fed ? new Date().toISOString() : null }
            : m,
        ),
      );
    },
    [petId, meals],
  );

  const addWater = useCallback(
    async (cups = 1) => {
      if (!petId) return;
      const { data, error } = await supabase
        .from('pet_water_logs')
        .insert({ pet_id: petId, log_date: selectedDate, cups })
        .select('*')
        .single();
      if (error) throw error;
      const log: WaterLog = {
        id: data.id,
        petId: data.pet_id,
        logDate: data.log_date,
        cups: Number(data.cups),
        loggedAt: data.logged_at,
      };
      setWaterLogs((prev) => [log, ...prev]);
    },
    [petId, selectedDate],
  );

  const addTreat = useCallback(
    async (treatName = 'Training treat', quantity = 1) => {
      if (!petId) return;
      const { data, error } = await supabase
        .from('pet_treat_logs')
        .insert({ pet_id: petId, log_date: selectedDate, treat_name: treatName, quantity })
        .select('*')
        .single();
      if (error) throw error;
      const log: TreatLog = {
        id: data.id,
        petId: data.pet_id,
        logDate: data.log_date,
        treatName: data.treat_name,
        quantity: data.quantity,
        loggedAt: data.logged_at,
      };
      setTreatLogs((prev) => [log, ...prev]);
    },
    [petId, selectedDate],
  );

  return {
    preferences,
    plan,
    foods,
    meals,
    dayMeals,
    mealsFed,
    mealProgress,
    waterLogs,
    dayWaterCups,
    treatLogs,
    dayTreatCount,
    foodDiary,
    selectedDate,
    setSelectedDate,
    isReady,
    loading,
    reload: loadNutrition,
    savePreferences,
    addFood,
    generatePlan,
    toggleMealFed,
    addWater,
    addTreat,
  };
}
