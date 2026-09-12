import { useCallback, useEffect, useState } from 'react';

import { buildPetMediaPath, removePetMedia, uploadPetFile } from '@/lib/petStorage';
import { supabase } from '@/lib/supabase';
import {
  CreatePetInput,
  petToRow,
  rowToPet,
  type Pet,
  type PetRow,
} from '@/types/pet';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPets = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setPets([]);
      return [];
    }

    const next = (data as PetRow[]).map(rowToPet);
    setPets(next);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPets()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load pets');
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPets]);

  const createPet = useCallback(async (input: CreatePetInput) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const row = petToRow({ ...input, ownerId: user.id });
    const { data, error: insertError } = await supabase
      .from('pets')
      .insert(row)
      .select('*')
      .single();

    if (insertError) throw insertError;
    const pet = rowToPet(data as PetRow);
    setPets((prev) => [...prev, pet]);
    return pet;
  }, []);

  const updatePet = useCallback(async (petId: string, input: CreatePetInput) => {
    const { data, error: updateError } = await supabase
      .from('pets')
      .update({
        name: input.name.trim(),
        breed: input.breed?.trim() ?? '',
        species: input.species ?? 'dog',
        gender: input.gender ?? null,
        birth_date: input.birthDate ?? null,
        weight_kg: input.weightKg ?? null,
      })
      .eq('id', petId)
      .select('*')
      .single();

    if (updateError) throw updateError;
    const pet = rowToPet(data as PetRow);
    setPets((prev) => prev.map((p) => (p.id === petId ? pet : p)));
    return pet;
  }, []);

  const setPetPhoto = useCallback(
    async (petId: string, ownerId: string, fileUri: string, mimeType: string, fileName: string) => {
      const current = pets.find((p) => p.id === petId);
      const storageKey = buildPetMediaPath(ownerId, petId, fileName);
      await uploadPetFile(storageKey, fileUri, mimeType);

      const { data, error: updateError } = await supabase
        .from('pets')
        .update({ photo_storage_key: storageKey })
        .eq('id', petId)
        .select('*')
        .single();

      if (updateError) throw updateError;
      if (current?.photoStorageKey && current.photoStorageKey !== storageKey) {
        await removePetMedia(current.photoStorageKey);
      }

      const pet = rowToPet(data as PetRow);
      setPets((prev) => prev.map((p) => (p.id === petId ? pet : p)));
      return pet;
    },
    [pets],
  );

  const deletePet = useCallback(async (petId: string) => {
    const current = pets.find((p) => p.id === petId);
    const { error: deleteError } = await supabase.from('pets').delete().eq('id', petId);
    if (deleteError) throw deleteError;
    if (current?.photoStorageKey) {
      await removePetMedia(current.photoStorageKey);
    }
    setPets((prev) => prev.filter((p) => p.id !== petId));
  }, [pets]);

  const getPet = useCallback(async (petId: string): Promise<Pet | null> => {
    const { data, error: fetchError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!data) return null;
    return rowToPet(data as PetRow);
  }, []);

  return {
    pets,
    isReady,
    error,
    loadPets,
    createPet,
    updatePet,
    setPetPhoto,
    deletePet,
    getPet,
  };
}
