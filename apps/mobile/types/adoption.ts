import type { ActivityLevel, PetGender, PetSpecies } from '@/types/pet';

export type ListingSourceType = 'owned' | 'stray' | 'rescued' | 'foster' | 'organization';
export type ListingStatus =
  | 'draft'
  | 'pending_verification'
  | 'active'
  | 'paused'
  | 'adopted'
  | 'removed';

export type PetSize = 'small' | 'medium' | 'large' | 'unknown';
export type HealthStatus = 'healthy' | 'recovering' | 'ongoing_condition' | 'needs_attention';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'contacted'
  | 'meet_and_greet'
  | 'home_check'
  | 'approved'
  | 'adoption_scheduled'
  | 'completed'
  | 'rejected'
  | 'withdrawn'
  | 'cancelled';

export type CompatibilityInsight = {
  type: 'positive' | 'warning';
  text: string;
};

export type StrayListingInfo = {
  foundLocation?: string;
  firstSeenDate?: string;
  caringForPet?: boolean;
  careDuration?: string;
  ownerStatus?: 'no_known_owner' | 'owner_may_be_looking' | 'unsure';
  ownerSearchChecks?: string[];
};

export type AdoptionRequirements = {
  homeVisit?: boolean;
  meetAndGreet?: boolean;
  followUp?: boolean;
  adoptionAgreement?: boolean;
  experiencedOwnerPreferred?: boolean;
};

export type AdoptionPreferences = {
  apartmentOk?: boolean;
  housePreferred?: boolean;
  otherPetsOk?: boolean;
  childrenOk?: boolean;
};

export type AdoptionListing = {
  id: string;
  listedBy: string;
  petId: string | null;
  sourceType: ListingSourceType;
  status: ListingStatus;
  title: string;
  description: string;
  petName: string;
  species: PetSpecies;
  breed: string;
  ageLabel: string;
  gender: PetGender | null;
  size: PetSize | null;
  color: string;
  weightKg: number | null;
  sterilized: boolean | null;
  goodWithChildren: boolean | null;
  goodWithDogs: boolean | null;
  goodWithCats: boolean | null;
  energyLevel: ActivityLevel | null;
  temperamentTags: string[];
  healthStatus: HealthStatus | null;
  vaccinationTags: string[];
  strayInfo: StrayListingInfo;
  adoptionRequirements: AdoptionRequirements;
  adoptionPreferences: AdoptionPreferences;
  city: string;
  state: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  publicLocationLabel: string;
  adoptionRadius: string;
  verificationStatus: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media?: AdoptionListingMedia[];
  applicationCount?: number;
};

export type AdoptionListingMedia = {
  id: string;
  listingId: string;
  mediaType: 'image' | 'video';
  storageKey: string;
  sortOrder: number;
  category: string | null;
  url?: string | null;
};

export type AdoptionApplication = {
  id: string;
  listingId: string;
  applicantId: string;
  status: ApplicationStatus;
  applicantProfile: Record<string, unknown>;
  home: Record<string, unknown>;
  household: Record<string, unknown>;
  existingPets: Record<string, unknown>[];
  experience: Record<string, unknown>;
  availability: Record<string, unknown>;
  financial: Record<string, unknown>;
  answers: Record<string, unknown>;
  compatibilityScore: number | null;
  compatibilityInsights: CompatibilityInsight[];
  submittedAt: string | null;
  updatedAt: string;
  listing?: AdoptionListing;
};

export type AdoptionMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type AdoptionConversation = {
  id: string;
  listingId: string;
  applicationId: string;
  listerId: string;
  applicantId: string;
  createdAt: string;
};

export type ListingFilters = {
  species?: PetSpecies | 'all';
  city?: string;
  maxDistanceKm?: number;
  ageBucket?: 'puppy' | 'young' | 'adult' | 'senior' | 'all';
  size?: PetSize | 'all';
  gender?: PetGender | 'all';
  goodWithChildren?: boolean;
  goodWithDogs?: boolean;
  vaccinated?: boolean;
  sterilized?: boolean;
  query?: string;
};

export const LISTING_SOURCE_OPTIONS: { id: ListingSourceType; label: string; emoji: string }[] = [
  { id: 'owned', label: 'My own pet', emoji: '🐶' },
  { id: 'stray', label: 'Stray / community pet', emoji: '🐾' },
  { id: 'rescued', label: 'Rescued pet', emoji: '❤️' },
  { id: 'foster', label: 'Fostered pet', emoji: '🏠' },
  { id: 'organization', label: 'Shelter / organization', emoji: '🏢' },
];

export const TEMPERAMENT_OPTIONS = [
  'Friendly',
  'Playful',
  'Shy',
  'Protective',
  'Energetic',
  'Calm',
  'Needs experienced owner',
];

export const VACCINATION_OPTIONS = ['Rabies', 'DHPP', 'Lepto', 'Other'];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pending',
  under_review: 'Under review',
  contacted: 'Contacted',
  meet_and_greet: 'Meet & greet',
  home_check: 'Home check',
  approved: 'Approved',
  adoption_scheduled: 'Adoption scheduled',
  completed: 'Completed',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  cancelled: 'Cancelled',
};

export const REPORT_REASONS = [
  'Suspected scam',
  'Wrong information',
  'Animal welfare concern',
  'Stolen pet',
  'Inappropriate content',
  'Selling instead of adoption',
  'Other',
];
