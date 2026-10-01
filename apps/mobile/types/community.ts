export type PackCategory =
  | 'location'
  | 'breed'
  | 'activity'
  | 'training'
  | 'rescue'
  | 'species'
  | 'interest'
  | 'pet_parents'
  | 'other';

export type PackPrivacy = 'public' | 'approval' | 'invite_only';
export type PackMemberRole = 'owner' | 'admin' | 'moderator' | 'member';
export type PackMemberStatus = 'pending' | 'active' | 'muted' | 'banned' | 'left';

export type MeetupType =
  | 'dog_walk'
  | 'playdate'
  | 'training'
  | 'pet_meetup'
  | 'adoption_event'
  | 'community'
  | 'other';

export type CommunityPack = {
  id: string;
  name: string;
  description: string;
  coverStorageKey: string | null;
  category: PackCategory;
  city: string;
  area: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  privacy: PackPrivacy;
  rules: string[];
  memberCount: number;
  createdBy: string;
  status: string;
  createdAt: string;
  distanceKm?: number;
  isMember?: boolean;
  memberStatus?: PackMemberStatus;
};

export type PackPost = {
  id: string;
  packId: string;
  authorId: string;
  authorName?: string;
  body: string;
  createdAt: string;
};

export type CommunityMeetup = {
  id: string;
  packId: string | null;
  createdBy: string;
  title: string;
  meetupType: MeetupType;
  description: string;
  startAt: string;
  endAt: string | null;
  locationName: string;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  maxAttendees: number | null;
  privacy: string;
  status: string;
  distanceKm?: number;
  goingCount?: number;
  userAttendance?: 'going' | 'interested' | null;
  hostName?: string;
};

export type NeighborProfile = {
  userId: string;
  name: string;
  city: string;
  locality: string;
  photoUri: string | null;
  distanceKm: number | null;
  petName?: string;
  petBreed?: string;
  petSpecies?: string;
  connectionStatus?: 'none' | 'pending' | 'accepted';
};

export type CommunityTab = 'packs' | 'meetups' | 'neighbors';

export const PACK_CATEGORY_OPTIONS: { id: PackCategory; label: string; emoji: string }[] = [
  { id: 'location', label: 'Location', emoji: '📍' },
  { id: 'breed', label: 'Breed', emoji: '🐕' },
  { id: 'activity', label: 'Activity', emoji: '🏃' },
  { id: 'training', label: 'Training', emoji: '🎓' },
  { id: 'rescue', label: 'Rescue', emoji: '❤️' },
  { id: 'species', label: 'Species', emoji: '🐱' },
  { id: 'interest', label: 'Interest', emoji: '🎯' },
  { id: 'pet_parents', label: 'Pet parents', emoji: '👨‍👩‍👧' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export const MEETUP_TYPE_OPTIONS: { id: MeetupType; label: string }[] = [
  { id: 'dog_walk', label: 'Dog walk' },
  { id: 'playdate', label: 'Playdate' },
  { id: 'training', label: 'Training session' },
  { id: 'pet_meetup', label: 'Pet meetup' },
  { id: 'adoption_event', label: 'Adoption event' },
  { id: 'community', label: 'Community event' },
  { id: 'other', label: 'Other' },
];

export const DEFAULT_PACK_RULES = [
  'Be respectful',
  'No spam',
  'No selling animals',
  'No abusive content',
];
