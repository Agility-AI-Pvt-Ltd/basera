export type GlobalPostType =
  | 'text'
  | 'photo'
  | 'video'
  | 'question'
  | 'tip'
  | 'adoption_story'
  | 'pet_update';

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
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author?: GlobalPostAuthor;
  likedByMe?: boolean;
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

/** True when the post media should use the video player (not image lightbox). */
export function isCommunityVideoMedia(
  post: Pick<GlobalPost, 'postType' | 'mediaUrl' | 'mediaStorageKey'>,
): boolean {
  if (post.postType === 'video') return true;
  const key = (post.mediaStorageKey ?? post.mediaUrl ?? '').toLowerCase();
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/.test(key);
}
