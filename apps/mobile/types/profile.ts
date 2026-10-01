export type LocalityPin = {
  latitude: number;
  longitude: number;
};

export type PetProfileDraft = {
  name: string;
  breed: string;
};

export type UserProfile = {
  name: string;
  isAdult: boolean;
  locality: string;
  city: string;
  localityPin: LocalityPin | null;
  photoUri?: string;
  bio?: string;
  hasDog: boolean | null;
  pet: PetProfileDraft | null;
  adoptionSetupDone: boolean;
  selectedPackIds: string[];
  signupComplete: boolean;
  neighborDiscoverability: 'nobody' | 'area' | 'pack_members' | 'everyone';
  showDistance: boolean;
  showPetToNeighbors: boolean;
};

/** Row shape from public.profiles */
export type ProfileRow = {
  id: string;
  phone: string | null;
  name: string;
  is_adult: boolean;
  locality: string;
  city: string;
  locality_lat: number | null;
  locality_lng: number | null;
  photo_uri: string | null;
  bio: string | null;
  has_dog: boolean | null;
  pet: PetProfileDraft | null;
  adoption_setup_done: boolean;
  selected_pack_ids: string[];
  signup_complete: boolean;
  neighbor_discoverability?: string;
  show_distance?: boolean;
  show_pet_to_neighbors?: boolean;
};

export function rowToProfile(row: ProfileRow): UserProfile {
  return {
    name: row.name,
    isAdult: row.is_adult,
    locality: row.locality,
    city: row.city,
    localityPin:
      row.locality_lat != null && row.locality_lng != null
        ? { latitude: row.locality_lat, longitude: row.locality_lng }
        : null,
    photoUri: row.photo_uri ?? undefined,
    bio: row.bio ?? undefined,
    hasDog: row.has_dog,
    pet: row.pet,
    adoptionSetupDone: row.adoption_setup_done,
    selectedPackIds: row.selected_pack_ids ?? [],
    signupComplete: row.signup_complete,
    neighborDiscoverability:
      (row.neighbor_discoverability as UserProfile['neighborDiscoverability']) ?? 'area',
    showDistance: row.show_distance ?? true,
    showPetToNeighbors: row.show_pet_to_neighbors ?? true,
  };
}

export function profileToRow(
  profile: UserProfile,
): Omit<ProfileRow, 'id' | 'phone' | 'created_at' | 'updated_at'> {
  return {
    name: profile.name,
    is_adult: profile.isAdult,
    locality: profile.locality,
    city: profile.city,
    locality_lat: profile.localityPin?.latitude ?? null,
    locality_lng: profile.localityPin?.longitude ?? null,
    photo_uri: profile.photoUri ?? null,
    bio: profile.bio ?? null,
    has_dog: profile.hasDog,
    pet: profile.pet,
    adoption_setup_done: profile.adoptionSetupDone,
    selected_pack_ids: profile.selectedPackIds,
    signup_complete: profile.signupComplete,
    neighbor_discoverability: profile.neighborDiscoverability,
    show_distance: profile.showDistance,
    show_pet_to_neighbors: profile.showPetToNeighbors,
  };
}

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  isAdult: false,
  locality: '',
  city: '',
  localityPin: null,
  hasDog: null,
  pet: null,
  adoptionSetupDone: false,
  selectedPackIds: [],
  signupComplete: false,
  neighborDiscoverability: 'area',
  showDistance: true,
  showPetToNeighbors: true,
};

export function hasCompletedBasics(profile: UserProfile): boolean {
  return (
    profile.name.trim().length >= 2 &&
    profile.isAdult === true &&
    profile.locality.trim().length >= 2 &&
    profile.city.trim().length >= 2 &&
    profile.localityPin !== null
  );
}

/** Next screen inside the signup stack, or null when ready for the main app. */
export function getSignupRoute(
  profile: UserProfile | null,
): 'Basics' | 'DogFork' | 'PetProfile' | 'AdoptionSetup' | 'Packs' | null {
  if (!profile || !hasCompletedBasics(profile)) {
    return 'Basics';
  }
  if (profile.hasDog === null) {
    return 'DogFork';
  }
  if (profile.hasDog && !profile.pet?.name.trim()) {
    return 'PetProfile';
  }
  if (!profile.hasDog && !profile.adoptionSetupDone) {
    return 'AdoptionSetup';
  }
  if (!profile.signupComplete) {
    return 'Packs';
  }
  return null;
}

/** @deprecated Use getSignupRoute */
export function getSignupHref(profile: UserProfile | null): string {
  const route = getSignupRoute(profile);
  if (!route) return '/';
  const map = {
    Basics: '/signup/basics',
    DogFork: '/signup/dog-fork',
    PetProfile: '/signup/pet-profile',
    AdoptionSetup: '/signup/adoption-setup',
    Packs: '/signup/packs',
  } as const;
  return map[route];
}
