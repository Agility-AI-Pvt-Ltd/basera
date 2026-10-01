import { getPetMediaUrl, uploadPetFile } from '@/lib/petStorage';

export function buildAdoptionMediaPath(userId: string, listingId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/adoption/${listingId}/${Date.now()}-${safeName}`;
}

export async function uploadAdoptionMedia(
  userId: string,
  listingId: string,
  fileUri: string,
  fileName: string,
  contentType: string,
): Promise<string> {
  const key = buildAdoptionMediaPath(userId, listingId, fileName);
  await uploadPetFile(key, fileUri, contentType);
  return key;
}

export async function getAdoptionMediaUrl(storageKey: string): Promise<string | null> {
  return getPetMediaUrl(storageKey);
}
