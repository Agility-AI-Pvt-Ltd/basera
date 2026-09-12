export type PetSpecies = 'dog' | 'cat' | 'bird' | 'fish' | 'other';
export type PetGender = 'male' | 'female' | 'unknown';

export type PetDocumentType =
  | 'vaccination_rabies'
  | 'vaccination_dhpp'
  | 'vaccination_lepto'
  | 'sterilisation'
  | 'other';

export type HealthCategory = 'vet_visit' | 'grooming' | 'medicine' | 'vaccination';
export type ActivityLevel = 'very_high' | 'high' | 'moderate' | 'low';
export type MealSlot = 'morning' | 'afternoon' | 'evening' | 'treat';

export type PetRow = {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  species: PetSpecies;
  gender: PetGender | null;
  birth_date: string | null;
  weight_kg: number | null;
  photo_storage_key: string | null;
  created_at: string;
  updated_at: string;
};

export type Pet = {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  species: PetSpecies;
  gender: PetGender | null;
  birthDate: string | null;
  weightKg: number | null;
  photoStorageKey: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PetDocumentRow = {
  id: string;
  pet_id: string;
  doc_type: PetDocumentType;
  storage_key: string;
  issued_date: string | null;
  expiry_date: string | null;
  verified: boolean;
  uploaded_at: string;
};

export type PetDocument = {
  id: string;
  petId: string;
  docType: PetDocumentType;
  storageKey: string;
  issuedDate: string | null;
  expiryDate: string | null;
  verified: boolean;
  uploadedAt: string;
};

export type DocumentStatus = 'verified' | 'pending' | 'expiring' | 'expired';

export type PetHealthEventRow = {
  id: string;
  pet_id: string;
  category: HealthCategory;
  title: string;
  subtitle: string;
  event_date: string;
  completed: boolean;
  notes: string | null;
  provider_name: string | null;
};

export type PetHealthEvent = {
  id: string;
  petId: string;
  category: HealthCategory;
  title: string;
  subtitle: string;
  eventDate: string;
  completed: boolean;
  notes: string | null;
  providerName: string | null;
};

export type PetTrainingSessionRow = {
  id: string;
  pet_id: string;
  title: string;
  duration_minutes: number;
  approaches: number;
  session_date: string;
  completed: boolean;
};

export type PetTrainingSession = {
  id: string;
  petId: string;
  title: string;
  durationMinutes: number;
  approaches: number;
  sessionDate: string;
  completed: boolean;
};

export type PetActivityDayRow = {
  pet_id: string;
  activity_date: string;
  level: ActivityLevel;
};

export type PetMealRow = {
  id: string;
  pet_id: string;
  meal_date: string;
  slot: MealSlot;
  description: string;
  amount_grams: number | null;
  completed: boolean;
};

export type PetMeal = {
  id: string;
  petId: string;
  mealDate: string;
  slot: MealSlot;
  description: string;
  amountGrams: number | null;
  completed: boolean;
};

export type PetNutritionDayRow = {
  pet_id: string;
  nutrition_date: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type PetNutritionDay = {
  petId: string;
  nutritionDate: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type CreatePetInput = {
  name: string;
  breed?: string;
  species?: PetSpecies;
  gender?: PetGender | null;
  birthDate?: string | null;
  weightKg?: number | null;
};

export const PET_DOCUMENT_LABELS: Record<PetDocumentType, string> = {
  vaccination_rabies: 'Rabies vaccination',
  vaccination_dhpp: 'DHPP vaccination',
  vaccination_lepto: 'Lepto vaccination',
  sterilisation: 'Sterilisation certificate',
  other: 'Other document',
};

export function rowToPet(row: PetRow): Pet {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    breed: row.breed,
    species: row.species,
    gender: row.gender,
    birthDate: row.birth_date,
    weightKg: row.weight_kg,
    photoStorageKey: row.photo_storage_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function petToRow(
  pet: CreatePetInput & { ownerId: string },
): Omit<PetRow, 'id' | 'created_at' | 'updated_at' | 'photo_storage_key'> {
  return {
    owner_id: pet.ownerId,
    name: pet.name.trim(),
    breed: pet.breed?.trim() ?? '',
    species: pet.species ?? 'dog',
    gender: pet.gender ?? null,
    birth_date: pet.birthDate ?? null,
    weight_kg: pet.weightKg ?? null,
  };
}

export function rowToPetDocument(row: PetDocumentRow): PetDocument {
  return {
    id: row.id,
    petId: row.pet_id,
    docType: row.doc_type,
    storageKey: row.storage_key,
    issuedDate: row.issued_date,
    expiryDate: row.expiry_date,
    verified: row.verified,
    uploadedAt: row.uploaded_at,
  };
}

export function getDocumentStatus(doc: PetDocument): DocumentStatus {
  if (doc.verified) return 'verified';
  if (doc.expiryDate) {
    const expiry = new Date(doc.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiry < today) return 'expired';
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    if (expiry <= soon) return 'expiring';
  }
  return 'pending';
}

export function computePetAgeMonths(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  return Math.max(0, months);
}

export function computePetAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const months = computePetAgeMonths(birthDate);
  if (months == null) return '—';
  if (months < 12) return `${Math.max(1, months)} mo`;
  const years = Math.floor(months / 12);
  return `${years} yr${years === 1 ? '' : 's'}`;
}

export function formatGender(gender: PetGender | null): string {
  if (gender === 'male') return 'Male';
  if (gender === 'female') return 'Female';
  return '—';
}
