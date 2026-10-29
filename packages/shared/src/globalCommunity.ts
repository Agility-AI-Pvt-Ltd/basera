export type GlobalPostType =
  | 'text'
  | 'photo'
  | 'video'
  | 'question'
  | 'tip'
  | 'adoption_story'
  | 'pet_update'
  | 'poll'
  | 'event';

export type GlobalEventVisibility = 'open' | 'invite_only';

export type GlobalEventRsvpStatus = 'interested' | 'going';

export type GlobalPostEventAttendee = {
  id: string;
  name: string;
  photoUri: string | null;
};

export type GlobalPostEvent = {
  title: string;
  startsAt: string;
  location: string;
  visibility: GlobalEventVisibility;
  interestedCount: number;
  goingCount: number;
  myStatus: GlobalEventRsvpStatus | null;
  attendees: GlobalPostEventAttendee[];
  isLive: boolean;
};

export type GlobalPostPollOption = {
  id: string;
  label: string;
  voteCount: number;
  percent: number;
};

export type GlobalPostPoll = {
  title: string;
  endsAt: string;
  totalVotes: number;
  options: GlobalPostPollOption[];
  myOptionId: string | null;
  isEnded: boolean;
};

export type GlobalPostAuthor = {
  id: string;
  name: string;
  photoUri: string | null;
};

export type GlobalPost = {
  id: string;
  authorId: string;
  body: string;
  postType: GlobalPostType;
  petName: string | null;
  mediaStorageKey: string | null;
  mediaUrl: string | null;
  /** Full image before mobile crop; used on web community feed. */
  originalMediaStorageKey: string | null;
  originalMediaUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author?: GlobalPostAuthor;
  likedByMe?: boolean;
  pollTitle?: string | null;
  pollEndsAt?: string | null;
  poll?: GlobalPostPoll | null;
  eventTitle?: string | null;
  eventStartsAt?: string | null;
  eventLocation?: string | null;
  eventVisibility?: GlobalEventVisibility | null;
  event?: GlobalPostEvent | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
};

export type GlobalComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  parentId: string | null;
  createdAt: string;
  author?: GlobalPostAuthor;
};

export function formatMemberCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

/** Local calendar day key (YYYY-MM-DD) for grouping feed items. */
export function feedDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Uppercase chat-style label: TODAY / YESTERDAY / 3 OCT 2026 */
export function formatFeedDateLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfPost = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfPost.getTime()) / 86400000);

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';

  return date
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    .toUpperCase();
}

export const POST_REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Inappropriate content',
  'Misleading',
  'Other',
] as const;

export type PostReportReason = (typeof POST_REPORT_REASONS)[number];

export function displayAuthorName(
  authorId: string,
  authorName: string | null | undefined,
  currentUserId: string | null | undefined,
): string {
  if (currentUserId && authorId === currentUserId) return 'You';
  return authorName?.trim() || 'Pet parent';
}

/** Preset avatars selectable on web community signup (replace art in packages/assets/images/avatars). */
export const PRESET_AVATAR_IDS = [
  'avatar-01',
  'avatar-02',
  'avatar-03',
  'avatar-04',
  'avatar-05',
  'avatar-06',
] as const;

export type PresetAvatarId = (typeof PRESET_AVATAR_IDS)[number];

const PRESET_AVATAR_PREFIX = 'preset:';

export function presetAvatarUri(id: PresetAvatarId | string): string {
  return `${PRESET_AVATAR_PREFIX}${id}`;
}

export function isPresetAvatarUri(uri: string | null | undefined): boolean {
  return typeof uri === 'string' && uri.startsWith(PRESET_AVATAR_PREFIX);
}

export function parsePresetAvatarId(uri: string | null | undefined): PresetAvatarId | null {
  if (!isPresetAvatarUri(uri)) return null;
  const id = uri!.slice(PRESET_AVATAR_PREFIX.length);
  return (PRESET_AVATAR_IDS as readonly string[]).includes(id) ? (id as PresetAvatarId) : null;
}

/** Web community needs a display name before joining the feed (mobile signup stays incomplete). */
export function hasWebCommunityProfile(profile: { name?: string | null; photo_uri?: string | null } | null): boolean {
  if (!profile) return false;
  return (profile.name ?? '').trim().length >= 2 && Boolean(profile.photo_uri?.trim());
}

/** True when the post media should use the video player (not image lightbox). */
export function isCommunityVideoMedia(
  post: Pick<GlobalPost, 'postType' | 'mediaUrl' | 'mediaStorageKey'>,
): boolean {
  if (post.postType === 'video') return true;
  const key = (post.mediaStorageKey ?? post.mediaUrl ?? '').toLowerCase();
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/.test(key);
}

/** Web feed: prefer uncropped original when the post has a separate crop for mobile. */
export function webCommunityPostMediaUrl(
  post: Pick<GlobalPost, 'mediaUrl' | 'originalMediaUrl' | 'postType' | 'mediaStorageKey'>,
): string | null {
  if (isCommunityVideoMedia(post)) return post.mediaUrl;
  return post.originalMediaUrl ?? post.mediaUrl;
}

export function formatPollRemaining(endsAt: string, now = Date.now()): string {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return 'Ended';
  const days = Math.ceil(ms / 86400000);
  if (days > 1) return `${days}d remaining`;
  if (days === 1) return '1d remaining';
  const hrs = Math.ceil(ms / 3600000);
  return hrs <= 1 ? '1h remaining' : `${hrs}h remaining`;
}

export function formatPollVoteCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K votes`;
  }
  return count === 1 ? '1 vote' : `${count} votes`;
}

export function formatEventStartsAt(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  return `${datePart} at ${timePart} ${sign}${hh}`;
}

export function formatEventPeopleCount(count: number): string {
  if (count <= 0) return 'Be the first';
  if (count >= 1000) {
    return `+${(count / 1000).toFixed(1).replace(/\.0$/, '')}K People`;
  }
  return `+${count} People`;
}

export function isLiveCommunityPoll(post: Pick<GlobalPost, 'postType' | 'poll'>): boolean {
  return post.postType === 'poll' && Boolean(post.poll) && !post.poll!.isEnded;
}

export function isLiveCommunityEvent(post: Pick<GlobalPost, 'postType' | 'event'>): boolean {
  return post.postType === 'event' && Boolean(post.event?.isLive);
}

export function hasTaggedLocation(
  post: Pick<GlobalPost, 'locationLat' | 'locationLng'>,
): boolean {
  return (
    typeof post.locationLat === 'number' &&
    typeof post.locationLng === 'number' &&
    Number.isFinite(post.locationLat) &&
    Number.isFinite(post.locationLng)
  );
}

/** Opens the exact pinned coordinates in Google Maps. */
export function googleMapsUrl(lat: number, lng: number, label?: string | null): string {
  const q = `${lat},${lng}`;
  if (label?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${label.trim()} ${q}`)}`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}`;
}

export function openStreetMapEmbedUrl(lat: number, lng: number, zoom = 15): string {
  const delta = Math.max(0.002, 0.18 / Math.max(zoom, 1));
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
}
