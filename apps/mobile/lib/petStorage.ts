import { supabase } from '@/lib/supabase';

export const PET_MEDIA_BUCKET = 'pet-media';

export function buildPetMediaPath(ownerId: string, petId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${ownerId}/${petId}/${Date.now()}-${safeName}`;
}

export async function uploadPetFile(
  storageKey: string,
  fileUri: string,
  contentType: string,
): Promise<string> {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(PET_MEDIA_BUCKET).upload(storageKey, blob, {
    contentType,
    upsert: false,
  });

  if (error) throw error;
  return storageKey;
}

export async function getPetMediaUrl(storageKey: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PET_MEDIA_BUCKET)
    .createSignedUrl(storageKey, 3600);

  if (error) return null;
  return data.signedUrl;
}

export async function removePetMedia(storageKey: string | null | undefined) {
  if (!storageKey) return;
  await supabase.storage.from(PET_MEDIA_BUCKET).remove([storageKey]);
}
