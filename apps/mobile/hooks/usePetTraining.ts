import { useCallback, useEffect, useState } from 'react';

import { generateWeeklyTasks, getWeekDates, getWeekStart } from '@/lib/trainingPlanGenerator';
import { supabase } from '@/lib/supabase';
import type { Pet } from '@/types/pet';
import type {
  PetTrainingPlan,
  PetTrainingPreferences,
  PetTrainingTask,
  TrainingDayProgress,
  TrainingPreferencesInput,
  TrainingStats,
} from '@/types/training';

type PreferencesRow = {
  pet_id: string;
  categories: string[];
  goals: string[];
  experience: PetTrainingPreferences['experience'];
  daily_time_minutes: number;
  difficulty: PetTrainingPreferences['difficulty'];
  environment: PetTrainingPreferences['environment'];
  has_outdoor_space: boolean | null;
  has_other_pets: boolean | null;
  has_children: boolean | null;
  activity_level: PetTrainingPreferences['activityLevel'];
  preferred_time: PetTrainingPreferences['preferredTime'];
  onboarded: boolean;
};

type TaskRow = {
  id: string;
  plan_id: string;
  pet_id: string;
  exercise_id: string;
  task_date: string;
  sort_order: number;
  title: string;
  category: string;
  display_tag: string;
  duration_minutes: number;
  description: string;
};

type CompletionRow = {
  task_id: string;
  completion_date: string;
  completed_at: string;
};

function mapPreferences(row: PreferencesRow): PetTrainingPreferences {
  return {
    petId: row.pet_id,
    categories: row.categories as PetTrainingPreferences['categories'],
    goals: row.goals as PetTrainingPreferences['goals'],
    experience: row.experience,
    dailyTimeMinutes: row.daily_time_minutes,
    difficulty: row.difficulty,
    environment: row.environment,
    hasOutdoorSpace: row.has_outdoor_space,
    hasOtherPets: row.has_other_pets,
    hasChildren: row.has_children,
    activityLevel: row.activity_level,
    preferredTime: row.preferred_time,
    onboarded: row.onboarded,
  };
}

function preferencesToRow(petId: string, input: TrainingPreferencesInput, onboarded: boolean) {
  return {
    pet_id: petId,
    categories: input.categories,
    goals: input.goals,
    experience: input.experience,
    daily_time_minutes: input.dailyTimeMinutes,
    difficulty: input.difficulty,
    environment: input.environment,
    has_outdoor_space: input.hasOutdoorSpace,
    has_other_pets: input.hasOtherPets,
    has_children: input.hasChildren,
    activity_level: input.activityLevel,
    preferred_time: input.preferredTime,
    onboarded,
  };
}

function mapTask(row: TaskRow, completion?: CompletionRow): PetTrainingTask {
  return {
    id: row.id,
    planId: row.plan_id,
    petId: row.pet_id,
    exerciseId: row.exercise_id,
    taskDate: row.task_date,
    sortOrder: row.sort_order,
    title: row.title,
    category: row.category,
    displayTag: row.display_tag as PetTrainingTask['displayTag'],
    durationMinutes: row.duration_minutes,
    description: row.description,
    completed: Boolean(completion),
    completedAt: completion?.completed_at ?? null,
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildWeekProgress(
  weekDates: string[],
  tasks: PetTrainingTask[],
): TrainingDayProgress[] {
  return weekDates.map((date) => {
    const dayTasks = tasks.filter((t) => t.taskDate === date);
    return {
      date,
      total: dayTasks.length,
      completed: dayTasks.filter((t) => t.completed).length,
    };
  });
}

function buildStats(tasks: PetTrainingTask[], weekProgress: TrainingDayProgress[]): TrainingStats {
  const totalSessions = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((totalSessions / totalTasks) * 100) : 0;

  let streakDays = 0;
  const sorted = [...weekProgress].sort((a, b) => b.date.localeCompare(a.date));
  for (const day of sorted) {
    if (day.total === 0) continue;
    if (day.completed === day.total) streakDays += 1;
    else if (day.date <= todayIso()) break;
  }

  return { streakDays, totalSessions, completionRate };
}

export function usePetTraining(petId: string | undefined, pet: Pet | null) {
  const [preferences, setPreferences] = useState<PetTrainingPreferences | null>(null);
  const [plan, setPlan] = useState<PetTrainingPlan | null>(null);
  const [tasks, setTasks] = useState<PetTrainingTask[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const weekStart = getWeekStart(new Date(`${selectedDate}T12:00:00`));
  const weekDates = getWeekDates(weekStart);
  const weekTasks = tasks.filter((t) => weekDates.includes(t.taskDate));
  const dayTasks = tasks
    .filter((t) => t.taskDate === selectedDate)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const weekProgress = buildWeekProgress(weekDates, weekTasks);
  const stats = buildStats(weekTasks, weekProgress);
  const dayCompleted = dayTasks.filter((t) => t.completed).length;

  const loadTraining = useCallback(async () => {
    if (!petId) return;

    const { data: prefRow } = await supabase
      .from('pet_training_preferences')
      .select('*')
      .eq('pet_id', petId)
      .maybeSingle();

    setPreferences(prefRow ? mapPreferences(prefRow as PreferencesRow) : null);

    const { data: planRow } = await supabase
      .from('pet_training_plans')
      .select('*')
      .eq('pet_id', petId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!planRow) {
      setPlan(null);
      setTasks([]);
      return;
    }

    setPlan({
      id: planRow.id,
      petId: planRow.pet_id,
      weekStart: planRow.week_start,
      isActive: planRow.is_active,
      createdAt: planRow.created_at,
    });

    const { data: taskRows } = await supabase
      .from('pet_training_tasks')
      .select('*')
      .eq('plan_id', planRow.id)
      .order('task_date')
      .order('sort_order');

    const taskIds = (taskRows as TaskRow[] | null)?.map((t) => t.id) ?? [];
    let completions: CompletionRow[] = [];
    if (taskIds.length) {
      const { data: completionRows } = await supabase
        .from('pet_training_completions')
        .select('task_id, completion_date, completed_at')
        .eq('pet_id', petId)
        .in('task_id', taskIds);
      completions = (completionRows as CompletionRow[] | null) ?? [];
    }

    const completionByTask = new Map(completions.map((c) => [c.task_id, c]));
    setTasks(
      ((taskRows as TaskRow[] | null) ?? []).map((row) =>
        mapTask(row, completionByTask.get(row.id)),
      ),
    );
  }, [petId]);

  useEffect(() => {
    if (!petId) {
      setIsReady(true);
      return;
    }
    setIsReady(false);
    loadTraining().finally(() => setIsReady(true));
  }, [petId, loadTraining]);

  const savePreferences = useCallback(
    async (input: TrainingPreferencesInput, onboarded = true) => {
      if (!petId) throw new Error('Missing pet');
      const row = preferencesToRow(petId, input, onboarded);
      const { data, error } = await supabase
        .from('pet_training_preferences')
        .upsert(row, { onConflict: 'pet_id' })
        .select('*')
        .single();
      if (error) throw error;
      const mapped = mapPreferences(data as PreferencesRow);
      setPreferences(mapped);
      return mapped;
    },
    [petId],
  );

  const generatePlan = useCallback(
    async (prefs?: PetTrainingPreferences, petOverride?: Pet) => {
      const activePet = petOverride ?? pet;
      if (!petId || !activePet) throw new Error('Missing pet');
      const activePrefs = prefs ?? preferences;
      if (!activePrefs) throw new Error('Set training preferences first');

      setLoading(true);
      try {
        const start = getWeekStart();
        await supabase
          .from('pet_training_plans')
          .update({ is_active: false })
          .eq('pet_id', petId)
          .eq('is_active', true);

        const { data: planRow, error: planError } = await supabase
          .from('pet_training_plans')
          .insert({ pet_id: petId, week_start: start, is_active: true })
          .select('*')
          .single();
        if (planError) throw planError;

        const generated = generateWeeklyTasks(activePet, activePrefs, start);
        if (generated.length) {
          const { error: taskError } = await supabase.from('pet_training_tasks').insert(
            generated.map((task) => ({
              plan_id: planRow.id,
              pet_id: petId,
              exercise_id: task.exerciseId,
              task_date: task.taskDate,
              sort_order: task.sortOrder,
              title: task.title,
              category: task.category,
              display_tag: task.displayTag,
              duration_minutes: task.durationMinutes,
              description: task.description,
            })),
          );
          if (taskError) throw taskError;
        }

        await loadTraining();
      } finally {
        setLoading(false);
      }
    },
    [petId, pet, preferences, loadTraining],
  );

  const toggleTaskComplete = useCallback(
    async (taskId: string, completed: boolean) => {
      if (!petId) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (completed) {
        const { error } = await supabase.from('pet_training_completions').upsert(
          {
            task_id: taskId,
            pet_id: petId,
            completion_date: task.taskDate,
          },
          { onConflict: 'task_id,completion_date' },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pet_training_completions')
          .delete()
          .eq('task_id', taskId)
          .eq('completion_date', task.taskDate);
        if (error) throw error;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed,
                completedAt: completed ? new Date().toISOString() : null,
              }
            : t,
        ),
      );
    },
    [petId, tasks],
  );

  return {
    preferences,
    plan,
    tasks,
    dayTasks,
    weekDates,
    weekProgress,
    stats,
    selectedDate,
    setSelectedDate,
    dayCompleted,
    isReady,
    loading,
    reload: loadTraining,
    savePreferences,
    generatePlan,
    toggleTaskComplete,
  };
}
