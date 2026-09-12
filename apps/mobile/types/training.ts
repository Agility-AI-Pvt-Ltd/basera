import type { ActivityLevel, PetSpecies } from '@/types/pet';

export type TrainingCategory =
  | 'indoor'
  | 'outdoor'
  | 'eating'
  | 'toilet'
  | 'basic_obedience'
  | 'leash_walking'
  | 'mental'
  | 'anxiety'
  | 'socialization'
  | 'tricks'
  | 'other';

export type TrainingGoal =
  | 'pulling_leash'
  | 'barking'
  | 'biting'
  | 'jumping'
  | 'not_listening'
  | 'eating_fast'
  | 'accidents_indoor'
  | 'separation'
  | 'recall'
  | 'slow_eating'
  | 'leash_walking'
  | 'other';

export type TrainingExperience = 'beginner' | 'some_training' | 'well_trained';
export type TrainingDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TrainingEnvironment = 'apartment' | 'house';
export type PreferredTrainingTime = 'morning' | 'afternoon' | 'evening' | 'flexible';
export type TrainingDisplayTag = 'PHYSICAL' | 'MENTAL' | 'INDOOR' | 'OUTDOOR' | 'MEALTIME';

export type TrainingExercise = {
  id: string;
  title: string;
  category: TrainingCategory | string;
  displayTag: TrainingDisplayTag;
  petTypes: PetSpecies[];
  difficulty: TrainingDifficulty;
  minAgeMonths: number;
  durationMinutes: number;
  description: string;
  steps: string[];
  goalTags: string[];
};

export type PetTrainingPreferences = {
  petId: string;
  categories: TrainingCategory[];
  goals: TrainingGoal[];
  experience: TrainingExperience;
  dailyTimeMinutes: number;
  difficulty: TrainingDifficulty;
  environment: TrainingEnvironment | null;
  hasOutdoorSpace: boolean | null;
  hasOtherPets: boolean | null;
  hasChildren: boolean | null;
  activityLevel: ActivityLevel | null;
  preferredTime: PreferredTrainingTime | null;
  onboarded: boolean;
};

export type PetTrainingPlan = {
  id: string;
  petId: string;
  weekStart: string;
  isActive: boolean;
  createdAt: string;
};

export type PetTrainingTask = {
  id: string;
  planId: string;
  petId: string;
  exerciseId: string;
  taskDate: string;
  sortOrder: number;
  title: string;
  category: string;
  displayTag: TrainingDisplayTag;
  durationMinutes: number;
  description: string;
  completed: boolean;
  completedAt: string | null;
};

export type TrainingDayProgress = {
  date: string;
  total: number;
  completed: number;
};

export type TrainingStats = {
  streakDays: number;
  totalSessions: number;
  completionRate: number;
};

export type TrainingPreferencesInput = Omit<PetTrainingPreferences, 'petId' | 'onboarded'>;

export const TRAINING_CATEGORY_OPTIONS: {
  id: TrainingCategory;
  label: string;
  emoji: string;
}[] = [
  { id: 'indoor', label: 'Indoor behavior', emoji: '🏠' },
  { id: 'outdoor', label: 'Outdoor behavior', emoji: '🌳' },
  { id: 'eating', label: 'Eating / Mealtime', emoji: '🍖' },
  { id: 'toilet', label: 'Toilet training', emoji: '🚽' },
  { id: 'basic_obedience', label: 'Basic obedience', emoji: '🐕' },
  { id: 'leash_walking', label: 'Leash walking', emoji: '🦮' },
  { id: 'mental', label: 'Mental stimulation', emoji: '🧠' },
  { id: 'anxiety', label: 'Anxiety / Calmness', emoji: '😌' },
  { id: 'socialization', label: 'Socialization', emoji: '🐾' },
  { id: 'tricks', label: 'Tricks', emoji: '🎯' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export const TRAINING_GOAL_OPTIONS: { id: TrainingGoal; label: string }[] = [
  { id: 'pulling_leash', label: 'Pulling leash' },
  { id: 'barking', label: 'Barking' },
  { id: 'biting', label: 'Biting / nipping' },
  { id: 'jumping', label: 'Jumping' },
  { id: 'not_listening', label: 'Not listening' },
  { id: 'eating_fast', label: 'Eating too quickly' },
  { id: 'accidents_indoor', label: 'Accidents indoors' },
  { id: 'separation', label: 'Separation issues' },
  { id: 'recall', label: 'Recall / come when called' },
  { id: 'slow_eating', label: 'Slow eating habits' },
  { id: 'leash_walking', label: 'Leash walking' },
  { id: 'other', label: 'Other' },
];

export const EXPERIENCE_OPTIONS: { id: TrainingExperience; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'some_training', label: 'Some training' },
  { id: 'well_trained', label: 'Well trained' },
];

export const DAILY_TIME_OPTIONS = [5, 10, 15, 20, 30] as const;

export const DIFFICULTY_OPTIONS: { id: TrainingDifficulty; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

export const DISPLAY_TAG_COLORS: Record<TrainingDisplayTag, string> = {
  PHYSICAL: '#FDE047',
  MENTAL: '#BFDBFE',
  INDOOR: '#FBCFE8',
  OUTDOOR: '#BBF7D0',
  MEALTIME: '#FED7AA',
};

export function formatRoutineDayLabel(dateIso: string): string {
  const date = new Date(`${dateIso}T12:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
}
