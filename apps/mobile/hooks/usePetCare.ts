import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type {
  PetActivityDayRow,
  PetHealthEvent,
  PetHealthEventRow,
} from '@/types/pet';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapHealth(row: PetHealthEventRow): PetHealthEvent {
  return {
    id: row.id,
    petId: row.pet_id,
    category: row.category,
    title: row.title,
    subtitle: row.subtitle,
    eventDate: row.event_date,
    completed: row.completed,
    notes: row.notes,
    providerName: row.provider_name,
  };
}

async function seedDefaultCare(petId: string) {
  const today = todayIso();
  await supabase.from('pet_health_events').insert([
    {
      pet_id: petId,
      category: 'vet_visit',
      title: 'Vet visit',
      subtitle: 'Dental check',
      event_date: today,
    },
    {
      pet_id: petId,
      category: 'grooming',
      title: 'Grooming',
      subtitle: 'Wash and cut',
      event_date: today,
    },
    {
      pet_id: petId,
      category: 'medicine',
      title: 'Medicines',
      subtitle: 'Antiparasitic tablets',
      event_date: today,
    },
    {
      pet_id: petId,
      category: 'vaccination',
      title: 'Vaccination',
      subtitle: 'Rabies shot',
      event_date: today,
      notes:
        'After vaccination, you will be given a veterinary passport indicating the date of vaccination and the type of vaccine.',
      provider_name: 'Doctor Turner',
    },
  ]);

}

export function usePetCare(petId: string | undefined) {
  const [healthEvents, setHealthEvents] = useState<PetHealthEvent[]>([]);
  const [activityDays, setActivityDays] = useState<PetActivityDayRow[]>([]);
  const [isReady, setIsReady] = useState(false);

  const loadCare = useCallback(async () => {
    if (!petId) return;

    let { data: health } = await supabase
      .from('pet_health_events')
      .select('*')
      .eq('pet_id', petId)
      .order('event_date', { ascending: true });

    if (!health?.length) {
      await seedDefaultCare(petId);
      const res = await supabase.from('pet_health_events').select('*').eq('pet_id', petId);
      health = res.data;
    }

    const { data: activityData } = await supabase
      .from('pet_activity_days')
      .select('*')
      .eq('pet_id', petId);

    setHealthEvents((health as PetHealthEventRow[] | null)?.map(mapHealth) ?? []);
    setActivityDays((activityData as PetActivityDayRow[] | null) ?? []);
  }, [petId]);

  useEffect(() => {
    if (!petId) {
      setIsReady(true);
      return;
    }
    setIsReady(false);
    loadCare().finally(() => setIsReady(true));
  }, [petId, loadCare]);

  const toggleHealthComplete = useCallback(async (id: string, completed: boolean) => {
    await supabase.from('pet_health_events').update({ completed }).eq('id', id);
    setHealthEvents((prev) => prev.map((e) => (e.id === id ? { ...e, completed } : e)));
  }, []);

  const addHealthEvent = useCallback(
    async (input: {
      category: PetHealthEvent['category'];
      title: string;
      subtitle?: string;
      eventDate?: string;
      notes?: string;
      providerName?: string;
    }) => {
      if (!petId) throw new Error('Missing pet');
      const { data, error } = await supabase
        .from('pet_health_events')
        .insert({
          pet_id: petId,
          category: input.category,
          title: input.title.trim(),
          subtitle: input.subtitle?.trim() ?? '',
          event_date: input.eventDate?.trim() || todayIso(),
          notes: input.notes?.trim() || null,
          provider_name: input.providerName?.trim() || null,
        })
        .select('*')
        .single();

      if (error) throw error;
      const event = mapHealth(data as PetHealthEventRow);
      setHealthEvents((prev) => [...prev, event]);
      return event;
    },
    [petId],
  );

  const deleteHealthEvent = useCallback(async (id: string) => {
    const { error } = await supabase.from('pet_health_events').delete().eq('id', id);
    if (error) throw error;
    setHealthEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateHealthEvent = useCallback(
    async (
      id: string,
      input: {
        category: PetHealthEvent['category'];
        title: string;
        subtitle?: string;
        eventDate?: string;
        notes?: string;
        providerName?: string;
      },
    ) => {
      const { data, error } = await supabase
        .from('pet_health_events')
        .update({
          category: input.category,
          title: input.title.trim(),
          subtitle: input.subtitle?.trim() ?? '',
          event_date: input.eventDate?.trim() || todayIso(),
          notes: input.notes?.trim() || null,
          provider_name: input.providerName?.trim() || null,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      const event = mapHealth(data as PetHealthEventRow);
      setHealthEvents((prev) => prev.map((e) => (e.id === id ? event : e)));
      return event;
    },
    [],
  );

  return {
    healthEvents,
    activityDays,
    isReady,
    reload: loadCare,
    toggleHealthComplete,
    addHealthEvent,
    updateHealthEvent,
    deleteHealthEvent,
  };
}
