import type { Pet } from '@/types/pet';
import type {
  MealType,
  PetFood,
  PetNutritionPlan,
  PetNutritionPreferences,
  TreatFrequency,
} from '@/types/nutrition';
import {
  defaultFeedingTimes,
  mealTypesForCount,
  TREAT_FREQUENCY_OPTIONS,
} from '@/types/nutrition';

export type GeneratedNutritionMeal = {
  mealDate: string;
  mealType: MealType;
  scheduledTime: string;
  foodId: string | null;
  foodName: string;
  foodType: string;
  plannedQuantity: number | null;
  unit: string;
  sortOrder: number;
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return isoDate(d);
}

export function getWeekDates(weekStart: string): string[] {
  const start = new Date(`${weekStart}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return isoDate(d);
  });
}

function treatLimit(freq: TreatFrequency | null): number {
  return TREAT_FREQUENCY_OPTIONS.find((o) => o.id === freq)?.limit ?? 5;
}

function softWaterGoalCups(pet: Pet): number {
  const weight = pet.weightKg ?? 10;
  return Math.round(Math.max(2, weight * 0.06) * 10) / 10;
}

function pickPrimaryFood(foods: PetFood[]): PetFood | null {
  return (
    foods.find((f) => f.foodType === 'dry_food') ??
    foods.find((f) => f.foodType === 'wet_food') ??
    foods[0] ??
    null
  );
}

function dailyPortionGrams(
  preferences: PetNutritionPreferences,
  foods: PetFood[],
  pet: Pet,
): number {
  if (preferences.typicalPortionGrams) return preferences.typicalPortionGrams;
  const primary = pickPrimaryFood(foods);
  if (primary?.quantity) return primary.quantity;
  const weight = pet.weightKg ?? 10;
  return Math.round(weight * 20);
}

export function buildPlanSummary(
  pet: Pet,
  preferences: PetNutritionPreferences,
  foods: PetFood[],
): Omit<PetNutritionPlan, 'id' | 'petId' | 'createdAt'> {
  const primary = pickPrimaryFood(foods);
  return {
    isActive: true,
    dailyMeals: preferences.mealsPerDay,
    mainFoodType: primary?.foodType ?? preferences.dietTypes[0] ?? 'dry_food',
    treatLimit: treatLimit(preferences.treatFrequency),
    waterGoalCups: softWaterGoalCups(pet),
    guidanceNotes:
      'Portions are estimates based on your inputs. Adjust with your veterinarian for medical or therapeutic diets.',
  };
}

export function generateWeeklyMeals(
  pet: Pet,
  preferences: PetNutritionPreferences,
  foods: PetFood[],
  weekStart: string,
): GeneratedNutritionMeal[] {
  const weekDates = getWeekDates(weekStart);
  const mealTypes = mealTypesForCount(preferences.mealsPerDay);
  const times =
    preferences.feedingTimes.length >= mealTypes.length
      ? preferences.feedingTimes.slice(0, mealTypes.length)
      : defaultFeedingTimes(preferences.mealsPerDay);

  const primary = pickPrimaryFood(foods);
  const foodName = primary?.name ?? 'Main meal';
  const foodType = primary?.foodType ?? preferences.dietTypes[0] ?? 'dry_food';
  const foodId = primary?.id ?? null;
  const unit = primary?.unit ?? 'grams';
  const dailyTotal = dailyPortionGrams(preferences, foods, pet);
  const perMeal = Math.round(dailyTotal / mealTypes.length);

  const meals: GeneratedNutritionMeal[] = [];
  weekDates.forEach((mealDate) => {
    mealTypes.forEach((mealType, sortOrder) => {
      meals.push({
        mealDate,
        mealType,
        scheduledTime: times[sortOrder] ?? '08:00',
        foodId,
        foodName,
        foodType,
        plannedQuantity: perMeal,
        unit,
        sortOrder,
      });
    });
  });
  return meals;
}
