import type { ActivityLevel } from '@/types/pet';

export type NutritionGoal =
  | 'maintain_weight'
  | 'weight_loss'
  | 'weight_gain'
  | 'growth'
  | 'digestion'
  | 'coat_skin'
  | 'energy'
  | 'general_health'
  | 'other';

export type DietType =
  | 'dry_food'
  | 'wet_food'
  | 'homemade'
  | 'raw'
  | 'treats'
  | 'supplements'
  | 'combination';

export type DietaryRestriction =
  | 'none'
  | 'allergies'
  | 'sensitivities'
  | 'ingredients_avoid'
  | 'vet_diet';

export type TreatFrequency = 'low' | 'moderate' | 'high';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FoodType = DietType | string;

export type PetNutritionPreferences = {
  petId: string;
  goal: NutritionGoal;
  dietTypes: DietType[];
  restrictions: DietaryRestriction[];
  allergyIngredients: string[];
  mealsPerDay: number;
  feedingTimes: string[];
  treatFrequency: TreatFrequency | null;
  portionMeasured: boolean;
  typicalPortionGrams: number | null;
  waterAccess: string | null;
  feedingLocation: string | null;
  activityLevel: ActivityLevel | null;
  onboarded: boolean;
};

export type PetFood = {
  id: string;
  petId: string;
  name: string;
  brand: string | null;
  foodType: FoodType;
  quantity: number | null;
  unit: string;
  ingredients: string[];
  isActive: boolean;
};

export type PetNutritionPlan = {
  id: string;
  petId: string;
  isActive: boolean;
  dailyMeals: number;
  mainFoodType: string | null;
  treatLimit: number;
  waterGoalCups: number | null;
  guidanceNotes: string | null;
  createdAt: string;
};

export type PetNutritionMeal = {
  id: string;
  planId: string;
  petId: string;
  mealDate: string;
  mealType: MealType;
  scheduledTime: string;
  foodId: string | null;
  foodName: string;
  foodType: string;
  plannedQuantity: number | null;
  unit: string;
  sortOrder: number;
  fed: boolean;
  fedAt: string | null;
};

export type WaterLog = {
  id: string;
  petId: string;
  logDate: string;
  cups: number;
  loggedAt: string;
};

export type TreatLog = {
  id: string;
  petId: string;
  logDate: string;
  treatName: string;
  quantity: number;
  loggedAt: string;
};

export type FoodDiaryEntry = {
  id: string;
  time: string;
  kind: 'meal' | 'treat' | 'water';
  title: string;
  subtitle: string;
  completed: boolean;
};

export type NutritionPreferencesInput = Omit<PetNutritionPreferences, 'petId' | 'onboarded'>;

export type PetFoodInput = {
  name: string;
  brand?: string;
  foodType: FoodType;
  quantity?: number | null;
  unit?: string;
  ingredients?: string[];
};

export const NUTRITION_GOAL_OPTIONS: { id: NutritionGoal; label: string }[] = [
  { id: 'maintain_weight', label: 'Maintain healthy weight' },
  { id: 'weight_loss', label: 'Weight loss' },
  { id: 'weight_gain', label: 'Weight gain' },
  { id: 'growth', label: 'Puppy/kitten growth' },
  { id: 'digestion', label: 'Improve digestion' },
  { id: 'coat_skin', label: 'Improve coat/skin' },
  { id: 'energy', label: 'Better energy' },
  { id: 'general_health', label: 'General healthy diet' },
  { id: 'other', label: 'Other' },
];

export const DIET_TYPE_OPTIONS: { id: DietType; label: string; emoji: string }[] = [
  { id: 'dry_food', label: 'Dry food / Kibble', emoji: '🥣' },
  { id: 'wet_food', label: 'Wet food', emoji: '🥫' },
  { id: 'homemade', label: 'Homemade food', emoji: '🍲' },
  { id: 'raw', label: 'Raw food', emoji: '🥩' },
  { id: 'treats', label: 'Treats', emoji: '🍖' },
  { id: 'supplements', label: 'Supplements', emoji: '💊' },
  { id: 'combination', label: 'Combination', emoji: '🍽' },
];

export const RESTRICTION_OPTIONS: { id: DietaryRestriction; label: string }[] = [
  { id: 'none', label: 'No known restrictions' },
  { id: 'allergies', label: 'Allergies' },
  { id: 'sensitivities', label: 'Food sensitivities' },
  { id: 'ingredients_avoid', label: 'Specific ingredients to avoid' },
  { id: 'vet_diet', label: 'Veterinary-recommended diet' },
];

export const ALLERGY_INGREDIENTS = ['Chicken', 'Beef', 'Dairy', 'Wheat', 'Soy', 'Fish', 'Egg'];

export const MEALS_PER_DAY_OPTIONS = [1, 2, 3, 4] as const;

export const TREAT_FREQUENCY_OPTIONS: { id: TreatFrequency; label: string; limit: number }[] = [
  { id: 'low', label: 'Low (1–3/day)', limit: 3 },
  { id: 'moderate', label: 'Moderate (4–6/day)', limit: 5 },
  { id: 'high', label: 'High (7+/day)', limit: 8 },
];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const MEAL_TYPE_EMOJI: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪',
};

export const NUTRITION_DISCLAIMER =
  'Guidance only — not veterinary advice. Confirm diet changes with your vet, especially for allergies or medical diets.';

export function formatFeedingTime(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function defaultFeedingTimes(mealsPerDay: number): string[] {
  if (mealsPerDay <= 1) return ['19:00'];
  if (mealsPerDay === 2) return ['08:00', '19:00'];
  if (mealsPerDay === 3) return ['08:00', '13:00', '19:00'];
  return ['08:00', '12:00', '17:00', '20:00'];
}

export function mealTypesForCount(count: number): MealType[] {
  if (count <= 1) return ['dinner'];
  if (count === 2) return ['breakfast', 'dinner'];
  if (count === 3) return ['breakfast', 'lunch', 'dinner'];
  return ['breakfast', 'lunch', 'dinner', 'snack'];
}
