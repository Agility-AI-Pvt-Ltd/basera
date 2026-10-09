import { uploadPetFile, PET_MEDIA_BUCKET } from '@/lib/petStorage';
import { supabase } from '@/lib/supabase';

export function buildProfilePhotoPath(userId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/profile/${Date.now()}-${safeName}`;
}

export async function uploadProfilePhoto(
  userId: string,
  fileUri: string,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const storageKey = buildProfilePhotoPath(userId, fileName);
  await uploadPetFile(storageKey, fileUri, mimeType);
  return storageKey;
}

export async function removeOldProfilePhoto(storageKey: string | null | undefined) {
  if (!storageKey || storageKey.startsWith('http') || storageKey.startsWith('preset:')) return;
  await supabase.storage.from(PET_MEDIA_BUCKET).remove([storageKey]);
}
