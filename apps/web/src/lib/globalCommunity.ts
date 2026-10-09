import { AVATAR_PRESETS } from '@basera/assets/web';
import {
  hasWebCommunityProfile,
  isPresetAvatarUri,
  parsePresetAvatarId,
  type GlobalComment,
  type GlobalPost,
  type GlobalPostType,
} from '@basera/shared';

import { supabase } from './supabase';

const PET_MEDIA_BUCKET = 'pet-media';

type PostRow = Record<string, unknown>;
type ProfileRow = { id: string; name: string; photo_uri: string | null };

function isAbsoluteUri(value: string): boolean {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('file://') ||
    value.startsWith('blob:')
  );
}

function resolvePresetAvatarUrl(uri: string): string | null {
  const id = parsePresetAvatarId(uri);
  if (!id) return null;
  return AVATAR_PRESETS[id] ?? null;
}

function mapAuthor(
  row: ProfileRow | null | undefined,
  fallbackId: string,
  photoUrls: Map<string, string>,
) {
  const key = row?.photo_uri ?? null;
  let photoUri: string | null = null;
  if (key) {
    photoUri =
      photoUrls.get(key) ??
      resolvePresetAvatarUrl(key) ??
      (isAbsoluteUri(key) ? key : null);
  }
  return {
    id: fallbackId,
    name: row?.name?.trim() || 'Pet parent',
    photoUri,
  };
}

function mediaPublicUrl(storageKey: string | null): string | null {
  if (!storageKey) return null;
  const { data } = supabase.storage.from('community-media').getPublicUrl(storageKey);
  return data.publicUrl;
}

async function loadProfiles(userIds: string[]): Promise<Map<string, ProfileRow>> {
  const map = new Map<string, ProfileRow>();
  if (userIds.length === 0) return map;
  const { data } = await supabase.from('profiles').select('id, name, photo_uri').in('id', userIds);
  for (const row of data ?? []) {
    map.set(row.id as string, row as ProfileRow);
  }
  return map;
}

/** Profile photos: preset keys, absolute URLs, or private pet-media storage keys. */
async function resolveProfilePhotoUrls(
  photoKeys: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const storageKeys: string[] = [];
  for (const key of photoKeys) {
    if (!key) continue;
    if (isPresetAvatarUri(key)) {
      const url = resolvePresetAvatarUrl(key);
      if (url) urls.set(key, url);
      continue;
    }
    if (isAbsoluteUri(key)) {
      urls.set(key, key);
      continue;
    }
    storageKeys.push(key);
  }
  const unique = [...new Set(storageKeys)];
  if (unique.length === 0) return urls;

  const { data, error } = await supabase.storage
    .from(PET_MEDIA_BUCKET)
    .createSignedUrls(unique, 60 * 60 * 6);
  if (error) {
    console.error('resolveProfilePhotoUrls', error);
    return urls;
  }
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

export function mapGlobalPost(
  row: PostRow,
  author: ProfileRow | undefined,
  likedByMe = false,
  photoUrls: Map<string, string> = new Map(),
): GlobalPost {
  const storageKey = (row.media_storage_key as string | null) ?? null;
  const authorId = row.author_id as string;
  return {
    id: row.id as string,
    authorId,
    body: row.body as string,
    postType: row.post_type as GlobalPostType,
    petName: (row.pet_name as string | null) ?? null,
    mediaStorageKey: storageKey,
    mediaUrl: mediaPublicUrl(storageKey),
    likeCount: Number(row.like_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    createdAt: row.created_at as string,
    author: mapAuthor(author, authorId, photoUrls),
    likedByMe,
  };
}

export async function fetchMemberCount(): Promise<number> {
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('signup_complete', true);
  return count ?? 0;
}

export async function fetchGlobalPosts(userId: string | null): Promise<GlobalPost[]> {
  const { data, error } = await supabase
    .from('global_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(80);

  if (error || !data) {
    console.error('fetchGlobalPosts', error);
    return [];
  }

  const rows = data as PostRow[];
  const authorIds = [...new Set(rows.map((r) => r.author_id as string))];
  const profiles = await loadProfiles(authorIds);
  const photoUrls = await resolveProfilePhotoUrls(
    [...profiles.values()].map((p) => p.photo_uri),
  );

  let liked = new Set<string>();
  if (userId) {
    const { data: likeRows } = await supabase
      .from('global_post_likes')
      .select('post_id')
      .eq('user_id', userId);
    liked = new Set((likeRows ?? []).map((r) => r.post_id as string));
  }

  return rows.map((row) =>
    mapGlobalPost(row, profiles.get(row.author_id as string), liked.has(row.id as string), photoUrls),
  );
}

function friendlyPostError(error: { message?: string; code?: string; details?: string }): string {
  if (error.code === '42501' || error.message?.includes('row-level security')) {
    return 'Not signed in or session expired. Sign out, sign in again with OTP, then post.';
  }
  if (error.code === '23503') {
    return 'Your profile is not ready yet. Finish signup in the mobile app, then try again.';
  }
  return error.message ?? 'Could not create post.';
}

export async function createGlobalPost(input: {
  authorId: string;
  body: string;
  postType?: GlobalPostType;
  petName?: string;
  mediaStorageKey?: string;
}): Promise<string | null> {
  const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
  if (refreshErr || !refreshed.session?.access_token) {
    return 'Session expired. Sign in again with OTP.';
  }

  const authorId = refreshed.session.user.id;
  if (authorId !== input.authorId) {
    return 'Session mismatch. Sign out and sign in again.';
  }

  const { error } = await supabase.from('global_posts').insert({
    author_id: authorId,
    body: input.body.trim(),
    post_type: input.postType ?? 'text',
    pet_name: input.petName?.trim() || null,
    media_storage_key: input.mediaStorageKey ?? null,
  });
  if (error) {
    console.error('createGlobalPost', error);
    return friendlyPostError(error);
  }
  return null;
}

export async function updateGlobalPost(input: {
  postId: string;
  body: string;
  postType?: GlobalPostType;
  petName?: string;
  mediaStorageKey?: string | null;
}): Promise<string | null> {
  const patch: Record<string, unknown> = {
    body: input.body.trim(),
    pet_name: input.petName?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (input.postType) patch.post_type = input.postType;
  if (input.mediaStorageKey !== undefined) patch.media_storage_key = input.mediaStorageKey;
  const { error } = await supabase.from('global_posts').update(patch).eq('id', input.postId);
  if (error) return friendlyPostError(error);
  return null;
}

export async function deleteGlobalPost(postId: string): Promise<string | null> {
  const { error } = await supabase.from('global_posts').delete().eq('id', postId);
  return error ? friendlyPostError(error) : null;
}

export async function reportGlobalPost(input: {
  postId: string;
  reporterId: string;
  reason: string;
  details?: string;
}): Promise<string | null> {
  const { error } = await supabase.from('global_post_reports').insert({
    post_id: input.postId,
    reporter_id: input.reporterId,
    reason: input.reason.trim(),
    details: input.details?.trim() || null,
  });
  if (error?.code === '23505') return 'You already reported this post.';
  return error ? friendlyPostError(error) : null;
}

export async function uploadCommunityFile(
  userId: string,
  file: File,
): Promise<{ key: string; kind: 'image' | 'video' } | null> {
  const kind: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
  const extFromName = file.name.split('.').pop()?.toLowerCase();
  const ext =
    extFromName && /^[a-z0-9]{2,5}$/.test(extFromName)
      ? extFromName
      : kind === 'video'
        ? 'mp4'
        : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('community-media').upload(path, file, {
    contentType: file.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
    upsert: false,
  });
  if (error) {
    console.error('uploadCommunityFile', error);
    return null;
  }
  return { key: path, kind };
}

export async function togglePostLike(postId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    await supabase.from('global_post_likes').delete().eq('post_id', postId).eq('user_id', userId);
  } else {
    await supabase.from('global_post_likes').insert({ post_id: postId, user_id: userId });
  }
}

export async function fetchComments(postId: string): Promise<GlobalComment[]> {
  const { data } = await supabase
    .from('global_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  const rows = (data ?? []) as PostRow[];
  const authorIds = [...new Set(rows.map((r) => r.author_id as string))];
  const profiles = await loadProfiles(authorIds);
  const photoUrls = await resolveProfilePhotoUrls(
    [...profiles.values()].map((p) => p.photo_uri),
  );

  return rows.map((row) => ({
    id: row.id as string,
    postId: row.post_id as string,
    authorId: row.author_id as string,
    body: row.body as string,
    parentId: (row.parent_id as string | null) ?? null,
    createdAt: row.created_at as string,
    author: mapAuthor(profiles.get(row.author_id as string), row.author_id as string, photoUrls),
  }));
}

export async function addComment(
  postId: string,
  authorId: string,
  body: string,
  parentId?: string | null,
): Promise<string | null> {
  const { error } = await supabase.from('global_post_comments').insert({
    post_id: postId,
    author_id: authorId,
    body: body.trim(),
    parent_id: parentId ?? null,
  });
  return error?.message ?? null;
}

export async function fetchProfilePreview(
  userId: string,
): Promise<{ name: string; photoUri: string | null; ready: boolean } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, photo_uri')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return null;
  const urls = await resolveProfilePhotoUrls([data.photo_uri as string | null]);
  const key = (data.photo_uri as string | null) ?? null;
  return {
    name: ((data.name as string) ?? '').trim() || 'You',
    photoUri: key
      ? (urls.get(key) ?? resolvePresetAvatarUrl(key) ?? (isAbsoluteUri(key) ? key : null))
      : null,
    ready: hasWebCommunityProfile(data),
  };
}

export async function uploadProfilePhotoFile(
  userId: string,
  file: File,
): Promise<string | null> {
  const extFromName = file.name.split('.').pop()?.toLowerCase();
  const ext = extFromName && /^[a-z0-9]{2,5}$/.test(extFromName) ? extFromName : 'jpg';
  const path = `${userId}/profile/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(PET_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) {
    console.error('uploadProfilePhotoFile', error);
    return null;
  }
  return path;
}

/** Saves web community display fields only — does not set signup_complete. */
export async function saveWebCommunityProfile(input: {
  userId: string;
  name: string;
  photoUri: string;
}): Promise<string | null> {
  const name = input.name.trim();
  if (name.length < 2) return 'Enter a name with at least 2 characters.';
  if (!input.photoUri.trim()) return 'Pick an avatar or upload a photo.';

  const { error } = await supabase
    .from('profiles')
    .update({
      name,
      photo_uri: input.photoUri,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.userId);

  if (error) {
    console.error('saveWebCommunityProfile', error);
    return error.message;
  }
  return null;
}

export function subscribeGlobalCommunity(onChange: () => void): () => void {
  const channel = supabase
    .channel('web-global-community')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'global_posts' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'global_post_likes' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'global_post_comments' }, onChange)
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
