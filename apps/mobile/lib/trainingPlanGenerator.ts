import { TRAINING_EXERCISES } from '@/constants/trainingExercises';
import type { Pet } from '@/types/pet';
import { computePetAgeMonths } from '@/types/pet';
import type {
  PetTrainingPreferences,
  TrainingDifficulty,
  TrainingExercise,
} from '@/types/training';

export type GeneratedTask = {
  exerciseId: string;
  taskDate: string;
  sortOrder: number;
  title: string;
  category: string;
  displayTag: string;
  durationMinutes: number;
  description: string;
};

const DIFFICULTY_RANK: Record<TrainingDifficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `date`. */
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

function scoreExercise(
  exercise: TrainingExercise,
  preferences: PetTrainingPreferences,
  pet: Pet,
  ageMonths: number,
): number {
  if (!exercise.petTypes.includes(pet.species) && pet.species !== 'other') {
    if (!exercise.petTypes.includes('dog')) return -1;
  }
  if (ageMonths < exercise.minAgeMonths) return -1;
  if (DIFFICULTY_RANK[exercise.difficulty] > DIFFICULTY_RANK[preferences.difficulty] + 1) {
    return -1;
  }

  let score = 0;
  if (preferences.categories.includes(exercise.category as never)) score += 12;
  if (preferences.categories.some((c) => exercise.goalTags.includes(c))) score += 6;

  for (const goal of preferences.goals) {
    if (exercise.goalTags.includes(goal)) score += 15;
  }

  if (exercise.difficulty === preferences.difficulty) score += 4;
  return score;
}

function pickExercisesForDay(
  pool: TrainingExercise[],
  preferences: PetTrainingPreferences,
  dayIndex: number,
  usedRecently: Set<string>,
): TrainingExercise[] {
  const budget = preferences.dailyTimeMinutes;
  const picked: TrainingExercise[] = [];
  let remaining = budget;

  const sorted = [...pool].sort((a, b) => {
    const aRecent = usedRecently.has(a.id) ? -5 : 0;
    const bRecent = usedRecently.has(b.id) ? -5 : 0;
    return b.durationMinutes - a.durationMinutes + bRecent - aRecent;
  });

  // Ensure at least one exercise per selected category across the week via rotation
  const categoryIndex = dayIndex % Math.max(preferences.categories.length, 1);
  const priorityCategory = preferences.categories[categoryIndex];
  if (priorityCategory) {
    const match = sorted.find(
      (e) =>
        (e.category === priorityCategory || e.goalTags.includes(priorityCategory)) &&
        e.durationMinutes <= remaining &&
        !picked.some((p) => p.id === e.id),
    );
    if (match) {
      picked.push(match);
      remaining -= match.durationMinutes;
    }
  }

  for (const exercise of sorted) {
    if (remaining <= 0) break;
    if (picked.some((p) => p.id === exercise.id)) continue;
    if (exercise.durationMinutes > remaining && picked.length > 0) continue;
    if (exercise.durationMinutes > remaining && picked.length === 0) {
      picked.push(exercise);
      remaining = 0;
      break;
    }
    picked.push(exercise);
    remaining -= exercise.durationMinutes;
  }

  return picked.slice(0, 4);
}

export function generateWeeklyTasks(
  pet: Pet,
  preferences: PetTrainingPreferences,
  weekStart: string,
): GeneratedTask[] {
  const ageMonths = computePetAgeMonths(pet.birthDate) ?? 12;
  const scored = TRAINING_EXERCISES.map((exercise) => ({
    exercise,
    score: scoreExercise(exercise, preferences, pet, ageMonths),
  }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  const pool = scored.map((s) => s.exercise);
  if (pool.length === 0) {
    return TRAINING_EXERCISES.filter((e) => e.petTypes.includes(pet.species) || pet.species === 'other')
      .slice(0, 3)
      .flatMap((exercise, idx) => [
        {
          exerciseId: exercise.id,
          taskDate: getWeekDates(weekStart)[idx % 7],
          sortOrder: 0,
          title: exercise.title,
          category: exercise.category,
          displayTag: exercise.displayTag,
          durationMinutes: exercise.durationMinutes,
          description: exercise.description,
        },
      ]);
  }

  const weekDates = getWeekDates(weekStart);
  const tasks: GeneratedTask[] = [];
  const recentlyUsed = new Set<string>();

  weekDates.forEach((taskDate, dayIndex) => {
    const dayExercises = pickExercisesForDay(pool, preferences, dayIndex, recentlyUsed);
    dayExercises.forEach((exercise, sortOrder) => {
      tasks.push({
        exerciseId: exercise.id,
        taskDate,
        sortOrder,
        title: exercise.title,
        category: exercise.category,
        displayTag: exercise.displayTag,
        durationMinutes: exercise.durationMinutes,
        description: exercise.description,
      });
      recentlyUsed.add(exercise.id);
    });
    if (recentlyUsed.size > 6) {
      const first = recentlyUsed.values().next().value;
      if (first) recentlyUsed.delete(first);
    }
  });

  return tasks;
}
