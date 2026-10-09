import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  displayAuthorName,
  feedDayKey,
  formatFeedDateLabel,
  formatMemberCount,
  isCommunityVideoMedia,
  POST_REPORT_REASONS,
  type GlobalComment,
  type GlobalPost,
  type GlobalPostType,
} from '@basera/shared';
import { WEB_IMAGES } from '@basera/assets/native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImageCropModal, POST_PHOTO_ASPECTS } from '@/components/ImageCropModal';
import { UserAvatar } from '@/components/UserAvatar';
import { Text } from '@/components/Themed';
import { FONT_FAMILY } from '@/constants/Fonts';
import { HOME_IMAGES } from '@/constants/home';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  addComment,
  createGlobalPost,
  deleteGlobalPost,
  fetchComments,
  fetchGlobalPosts,
  fetchMemberCount,
  reportGlobalPost,
  subscribeGlobalCommunity,
  togglePostLike,
  updateGlobalPost,
  uploadCommunityMedia,
} from '@/lib/globalCommunity';
import { supabase } from '@/lib/supabase';

const BRAND = '#7C3AED';

function CommunityVideo({
  uri,
  style,
  contentFit,
  play = false,
  controls = false,
}: {
  uri: string;
  style: StyleProp<ViewStyle>;
  contentFit: 'contain' | 'cover';
  play?: boolean;
  controls?: boolean;
}) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.muted = !play;
    instance.loop = false;
  });

  useEffect(() => {
    if (play) player.play();
  }, [play, player]);

  return (
    <VideoView
      player={player}
      style={style}
      contentFit={contentFit}
      nativeControls={controls}
      pointerEvents={controls ? 'auto' : 'none'}
    />
  );
}

type FeedRow =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'post'; key: string; post: GlobalPost };

function buildFeedRows(posts: GlobalPost[]): FeedRow[] {
  const rows: FeedRow[] = [];
  let lastDay: string | null = null;
  for (const post of posts) {
    const day = feedDayKey(post.createdAt);
    if (day !== lastDay) {
      rows.push({ kind: 'date', key: `date-${day}`, label: formatFeedDateLabel(post.createdAt) });
      lastDay = day;
    }
    rows.push({ kind: 'post', key: post.id, post });
  }
  return rows;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={styles.dateRow}>
      <View style={styles.dateLine} />
      <Text style={styles.dateLabel}>{label}</Text>
      <View style={styles.dateLine} />
    </View>
  );
}

type MediaPreview = { url: string; kind: 'image' | 'video' };

type FloatHeartSpec = {
  id: number;
  drift: number;
  delay: number;
  size: number;
  startX: number;
};

function FloatingHeart({
  heart,
  onDone,
}: {
  heart: FloatHeartSpec;
  onDone: (id: number) => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      heart.delay,
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onDone)(heart.id);
      }),
    );
  }, [heart.delay, heart.id, onDone, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.15 ? progress.value / 0.15 : 1 - (progress.value - 0.15) / 0.85,
    transform: [
      { translateX: heart.startX + heart.drift * progress.value },
      { translateY: -8 - 70 * progress.value },
      { scale: 0.45 + 0.7 * progress.value },
      { rotate: `${-12 + 26 * progress.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.floatHeart, style]} pointerEvents="none">
      <Ionicons name="heart" size={heart.size} color="#F43F5E" />
    </Animated.View>
  );
}

function PostCard({
  post,
  authorLabel,
  onLike,
  onComment,
  onShare,
  onOpenMedia,
  onMenu,
}: {
  post: GlobalPost;
  authorLabel: string;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onOpenMedia: (preview: MediaPreview) => void;
  onMenu: () => void;
}) {
  const isVideo = Boolean(post.mediaUrl && isCommunityVideoMedia(post));
  const [hearts, setHearts] = useState<FloatHeartSpec[]>([]);
  const heartId = useRef(0);

  const removeHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleLike = () => {
    if (!post.likedByMe) {
      const burst = Array.from({ length: 8 }, () => {
        heartId.current += 1;
        return {
          id: heartId.current,
          drift: -30 + Math.random() * 60,
          delay: Math.floor(Math.random() * 120),
          size: 12 + Math.floor(Math.random() * 10),
          startX: -6 + Math.random() * 18,
        };
      });
      setHearts((prev) => [...prev, ...burst]);
    }
    onLike();
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <UserAvatar photoUri={post.author?.photoUri} size={40} />
        <View style={styles.postHeaderText}>
          <Text style={styles.postAuthor}>{authorLabel}</Text>
          {post.petName ? <Text style={styles.postPet}>🐶 {post.petName}</Text> : null}
          <Text style={styles.postTime}>{timeAgo(post.createdAt)}</Text>
        </View>
        <Pressable onPress={onMenu} hitSlop={8} accessibilityLabel="Post menu">
          <Feather name="more-horizontal" size={20} color="#9CA3AF" />
        </Pressable>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      {post.mediaUrl ? (
        <Pressable
          style={styles.postMediaWrap}
          onPress={() =>
            onOpenMedia({ url: post.mediaUrl!, kind: isVideo ? 'video' : 'image' })
          }>
          {isVideo ? (
            <>
              <CommunityVideo uri={post.mediaUrl} style={styles.postMedia} contentFit="contain" />
              <View style={styles.playBadge} pointerEvents="none">
                <View style={styles.playBadgeCircle}>
                  <Feather name="play" size={28} color={BRAND} style={{ marginLeft: 3 }} />
                </View>
              </View>
            </>
          ) : (
            <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} contentFit="contain" />
          )}
        </Pressable>
      ) : null}
      <View style={styles.postActions}>
        <View style={styles.likeWrap}>
          <Pressable
            style={[styles.actionBtn, post.likedByMe && styles.actionBtnLiked]}
            onPress={handleLike}>
            <Ionicons
              name={post.likedByMe ? 'heart' : 'heart-outline'}
              size={20}
              color={post.likedByMe ? '#E11D48' : '#374151'}
            />
            <Text style={[styles.actionText, post.likedByMe && styles.actionTextLiked]}>
              {post.likeCount}
            </Text>
          </Pressable>
          <View style={styles.floatHeartLayer} pointerEvents="none">
            {hearts.map((h) => (
              <FloatingHeart key={h.id} heart={h} onDone={removeHeart} />
            ))}
          </View>
        </View>
        <Pressable style={styles.actionBtn} onPress={onComment}>
          <Ionicons name="chatbubble-ellipses-outline" size={19} color="#374151" />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onShare}>
          <Ionicons name="paper-plane-outline" size={19} color="#374151" />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCommentCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(count);
}

type CommentVote = 'up' | 'down' | null;

function CommentsSheet({
  visible,
  userId,
  myPhotoUri,
  comments,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  userId: string | null;
  myPhotoUri?: string | null;
  comments: GlobalComment[];
  onClose: () => void;
  onSubmit: (body: string, parentId: string | null) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [sort, setSort] = useState<'popular' | 'newest'>('newest');
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<GlobalComment | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; mine: CommentVote }>>(
    {},
  );
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) {
      setDraft('');
      setReplyTo(null);
      setExpanded(new Set());
      setSort('newest');
    }
  }, [visible]);

  const roots = useMemo(() => {
    const top = comments.filter((c) => !c.parentId);
    if (sort === 'newest') {
      return [...top].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    return [...top].sort((a, b) => {
      const aReplies = comments.filter((c) => c.parentId === a.id).length;
      const bReplies = comments.filter((c) => c.parentId === b.id).length;
      if (bReplies !== aReplies) return bReplies - aReplies;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [comments, sort]);

  const repliesOf = useCallback(
    (id: string) =>
      comments
        .filter((c) => c.parentId === id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [comments],
  );

  const voteOf = (id: string) => votes[id] ?? { up: 0, down: 0, mine: null as CommentVote };

  const toggleVote = (id: string, next: 'up' | 'down') => {
    setVotes((prev) => {
      const cur = prev[id] ?? { up: 0, down: 0, mine: null as CommentVote };
      let { up, down, mine } = cur;
      if (mine === next) {
        if (next === 'up') up = Math.max(0, up - 1);
        else down = Math.max(0, down - 1);
        mine = null;
      } else {
        if (mine === 'up') up = Math.max(0, up - 1);
        if (mine === 'down') down = Math.max(0, down - 1);
        if (next === 'up') up += 1;
        else down += 1;
        mine = next;
      }
      return { ...prev, [id]: { up, down, mine } };
    });
  };

  const submit = async () => {
    if (draft.trim().length < 1 || sending) return;
    setSending(true);
    await onSubmit(draft.trim(), replyTo?.id ?? null);
    setSending(false);
    setDraft('');
    setReplyTo(null);
  };

  const startReply = (comment: GlobalComment) => {
    setReplyTo(comment);
    setExpanded((prev) => new Set(prev).add(comment.parentId ?? comment.id));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const renderComment = (comment: GlobalComment, isReply = false) => {
    const name = displayAuthorName(comment.authorId, comment.author?.name, userId);
    const replies = repliesOf(comment.id);
    const open = expanded.has(comment.id);
    const v = voteOf(comment.id);

    return (
      <View key={comment.id} style={[styles.cmt, isReply && styles.cmtReply]}>
        <UserAvatar photoUri={comment.author?.photoUri} size={40} />
        <View style={styles.cmtMain}>
          <View style={styles.cmtHead}>
            <View style={styles.cmtMeta}>
              <Text style={styles.cmtName}>{name}</Text>
              <Text style={styles.cmtDate}>{formatCommentDate(comment.createdAt)}</Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => Alert.alert('Coming soon', 'Comment menu is coming soon.')}>
              <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
            </Pressable>
          </View>
          <Text style={styles.cmtBody}>{comment.body}</Text>
          <Pressable onPress={() => Alert.alert('Coming soon', 'Translate is coming soon.')}>
            <Text style={styles.cmtTranslate}>Translate</Text>
          </Pressable>
          <View style={styles.cmtActions}>
            <Pressable style={styles.cmtAction} onPress={() => toggleVote(comment.id, 'up')}>
              <Ionicons
                name={v.mine === 'up' ? 'thumbs-up' : 'thumbs-up-outline'}
                size={15}
                color={v.mine === 'up' ? BRAND : '#6B7280'}
              />
              <Text style={[styles.cmtActionText, v.mine === 'up' && styles.cmtActionActive]}>
                {v.up}
              </Text>
            </Pressable>
            <Pressable style={styles.cmtAction} onPress={() => toggleVote(comment.id, 'down')}>
              <Ionicons
                name={v.mine === 'down' ? 'thumbs-down' : 'thumbs-down-outline'}
                size={15}
                color={v.mine === 'down' ? BRAND : '#6B7280'}
              />
              <Text style={[styles.cmtActionText, v.mine === 'down' && styles.cmtActionActive]}>
                {v.down}
              </Text>
            </Pressable>
            <Pressable style={styles.cmtAction} onPress={() => startReply(comment)}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color="#6B7280" />
              <Text style={styles.cmtActionText}>Reply</Text>
            </Pressable>
          </View>
          {!isReply && replies.length > 0 ? (
            <Pressable
              style={styles.cmtRepliesToggle}
              onPress={() =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(comment.id)) next.delete(comment.id);
                  else next.add(comment.id);
                  return next;
                })
              }>
              <Text style={styles.cmtRepliesToggleText}>
                {open ? 'Hide' : 'See'} {replies.length}{' '}
                {replies.length === 1 ? 'Reply' : 'Replies'}
              </Text>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={BRAND}
              />
            </Pressable>
          ) : null}
          {open ? replies.map((r) => renderComment(r, true)) : null}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.commentsModalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.commentsBackdrop} onPress={onClose} />
        <View style={[styles.commentsSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>
              Comments{' '}
              <Text style={styles.commentsCount}>({formatCommentCount(comments.length)})</Text>
            </Text>
            <View style={styles.commentsSort}>
              <Pressable
                style={[styles.commentsSortBtn, sort === 'popular' && styles.commentsSortActive]}
                onPress={() => setSort('popular')}>
                <Ionicons
                  name="trending-up"
                  size={14}
                  color={sort === 'popular' ? '#111827' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.commentsSortText,
                    sort === 'popular' && styles.commentsSortTextActive,
                  ]}>
                  Popular
                </Text>
              </Pressable>
              <Pressable
                style={[styles.commentsSortBtn, sort === 'newest' && styles.commentsSortActive]}
                onPress={() => setSort('newest')}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={sort === 'newest' ? '#111827' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.commentsSortText,
                    sort === 'newest' && styles.commentsSortTextActive,
                  ]}>
                  Newest
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.commentsComposer}>
            <UserAvatar photoUri={myPhotoUri} size={40} />
            <View style={styles.commentsInputWrap}>
              {replyTo ? (
                <View style={styles.commentsReplying}>
                  <Text style={styles.commentsReplyingText}>
                    Replying to{' '}
                    <Text style={styles.commentsReplyingName}>
                      {displayAuthorName(replyTo.authorId, replyTo.author?.name, userId)}
                    </Text>
                  </Text>
                  <Pressable onPress={() => setReplyTo(null)}>
                    <Text style={styles.commentsReplyingCancel}>Cancel</Text>
                  </Pressable>
                </View>
              ) : null}
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
                placeholder="Write your comments here..."
                placeholderTextColor="#9CA3AF"
                style={styles.commentsInput}
                multiline
              />
              <Pressable
                style={[
                  styles.commentsSend,
                  (sending || draft.trim().length < 1) && styles.commentsSendDisabled,
                ]}
                disabled={sending || draft.trim().length < 1}
                onPress={() => void submit()}>
                {sending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled">
            {roots.length === 0 ? (
              <Text style={styles.commentsEmpty}>No comments yet. Start the conversation.</Text>
            ) : (
              roots.map((c) => renderComment(c))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type PickedMedia = { uri: string; kind: 'image' | 'video'; mimeType?: string | null };

type ComposerSubmit = {
  body: string;
  petName: string;
  media: PickedMedia | null;
  clearMedia: boolean;
};

function ComposePostModal({
  visible,
  mode,
  initial,
  posting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  mode: 'create' | 'edit';
  initial: GlobalPost | null;
  posting: boolean;
  onClose: () => void;
  onSubmit: (input: ComposerSubmit) => void;
}) {
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('');
  const [petName, setPetName] = useState('');
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [clearMedia, setClearMedia] = useState(false);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setCropUri(null);
      return;
    }
    setBody(initial?.body ?? '');
    setPetName(initial?.petName ?? '');
    setMedia(null);
    setClearMedia(false);
    setCropUri(null);
    setCropSource(null);
  }, [visible, initial]);

  const pick = async (kind: 'image' | 'video') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow media access to attach a photo or video.');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'video' ? ['videos'] : ['images'],
      quality: 0.85,
      videoMaxDuration: 90,
    });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    if (kind === 'image') {
      setCropSource(asset.uri);
      setCropUri(asset.uri);
      return;
    }
    setMedia({ uri: asset.uri, kind, mimeType: asset.mimeType });
    setClearMedia(false);
  };

  const existingMedia =
    !clearMedia && !media && initial?.mediaUrl
      ? { url: initial.mediaUrl, kind: isCommunityVideoMedia(initial) ? 'video' : 'image' }
      : null;

  const canSubmit =
    !posting &&
    (body.trim().length >= 2 || Boolean(media) || Boolean(existingMedia));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.commentsModalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.commentsBackdrop} onPress={onClose} />
        <View style={[styles.composeSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.composeHeader}>
            <Text style={styles.commentsTitle}>{mode === 'edit' ? 'Edit post' : 'New post'}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Share a moment, ask a question, or post a tip..."
              placeholderTextColor="#9CA3AF"
              style={styles.composeInput}
              multiline
              autoFocus
            />
            <TextInput
              value={petName}
              onChangeText={setPetName}
              placeholder="Pet name (optional)"
              placeholderTextColor="#9CA3AF"
              style={styles.petInput}
            />
            {media ? (
              <View style={styles.composePreview}>
                {media.kind === 'video' ? (
                  <CommunityVideo uri={media.uri} style={styles.composePreviewMedia} contentFit="cover" />
                ) : (
                  <Image source={{ uri: media.uri }} style={styles.composePreviewMedia} contentFit="cover" />
                )}
                <Pressable
                  style={styles.composeAdjust}
                  onPress={() => setCropUri(cropSource ?? media.uri)}>
                  <Text style={styles.composeAdjustText}>Adjust</Text>
                </Pressable>
                <Pressable
                  style={styles.composeRemoveMedia}
                  onPress={() => {
                    setMedia(null);
                    setCropSource(null);
                  }}>
                  <Feather name="x" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : existingMedia ? (
              <View style={styles.composePreview}>
                {existingMedia.kind === 'video' ? (
                  <CommunityVideo
                    uri={existingMedia.url}
                    style={styles.composePreviewMedia}
                    contentFit="cover"
                  />
                ) : (
                  <Image
                    source={{ uri: existingMedia.url }}
                    style={styles.composePreviewMedia}
                    contentFit="cover"
                  />
                )}
                <Pressable
                  style={styles.composeRemoveMedia}
                  onPress={() => setClearMedia(true)}>
                  <Feather name="x" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.composerActions}>
            <Pressable style={styles.chipBtn} onPress={() => void pick('image')}>
              <Feather name="image" size={16} color={BRAND} />
              <Text style={styles.chipText}>Photo</Text>
            </Pressable>
            <Pressable style={styles.chipBtn} onPress={() => void pick('video')}>
              <Feather name="video" size={16} color={BRAND} />
              <Text style={styles.chipText}>Video</Text>
            </Pressable>
            <Pressable
              style={[styles.postBtn, !canSubmit && styles.commentsSendDisabled]}
              disabled={!canSubmit}
              onPress={() => onSubmit({ body, petName, media, clearMedia })}>
              {posting ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.postBtnText}>{mode === 'edit' ? 'Save' : 'Post'}</Text>
              )}
            </Pressable>
          </View>
        </View>
        {cropUri ? (
          <View style={styles.cropHost}>
            <ImageCropModal
              embedded
              visible
              imageUri={cropUri}
              aspects={POST_PHOTO_ASPECTS}
              onCancel={() => setCropUri(null)}
              onCropped={(cropped) => {
                setMedia({ uri: cropped.uri, kind: 'image', mimeType: cropped.mimeType });
                setClearMedia(false);
                setCropUri(null);
              }}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReportPostModal({
  visible,
  posting,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  posting: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<string>(POST_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (!visible) {
      setReason(POST_REPORT_REASONS[0]);
      setDetails('');
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.commentsModalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.commentsBackdrop} onPress={onClose} />
        <View style={[styles.composeSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.composeHeader}>
            <Text style={styles.commentsTitle}>Report post</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={22} color="#6B7280" />
            </Pressable>
          </View>
          <Text style={styles.reportHint}>Why are you reporting this post?</Text>
          <View style={styles.reasonWrap}>
            {POST_REPORT_REASONS.map((item) => (
              <Pressable
                key={item}
                style={[styles.chipBtn, reason === item && styles.reasonChipActive]}
                onPress={() => setReason(item)}>
                <Text style={[styles.chipText, reason === item && styles.reasonChipTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Add details (optional)"
            placeholderTextColor="#9CA3AF"
            style={styles.composeInput}
            multiline
          />
          <Pressable
            style={[styles.postBtn, styles.reportSubmit, posting && styles.commentsSendDisabled]}
            disabled={posting}
            onPress={() => onSubmit(reason, details)}>
            {posting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.postBtnText}>Submit report</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MediaPreviewModal({
  preview,
  onClose,
}: {
  preview: MediaPreview | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  if (!preview) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.mediaPreviewRoot}>
        <Pressable
          style={[styles.mediaPreviewClose, { top: insets.top + 8 }]}
          onPress={onClose}
          hitSlop={12}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        {preview.kind === 'video' ? (
          <CommunityVideo
            uri={preview.url}
            style={styles.mediaPreviewVideo}
            contentFit="contain"
            play
            controls
          />
        ) : (
          <Pressable style={styles.mediaPreviewImageWrap} onPress={onClose}>
            <Image
              source={{ uri: preview.url }}
              style={styles.mediaPreviewImage}
              contentFit="contain"
            />
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

export default function GlobalCommunityScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useUserProfile();
  const [userId, setUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<GlobalPost[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [composer, setComposer] = useState<null | { mode: 'create' | 'edit'; post: GlobalPost | null }>(
    null,
  );
  const [reportPost, setReportPost] = useState<GlobalPost | null>(null);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<GlobalComment[]>([]);
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
  }, []);

  const feedRows = useMemo(() => buildFeedRows(posts), [posts]);

  const reload = useCallback(async () => {
    const [nextPosts, count] = await Promise.all([fetchGlobalPosts(userId), fetchMemberCount()]);
    setPosts(nextPosts);
    setMemberCount(count);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => subscribeGlobalCommunity(() => void reload()), [reload]);

  const submitComposer = async (input: ComposerSubmit) => {
    if (!userId || !composer) return;
    const keptMedia = composer.mode === 'edit' && composer.post?.mediaStorageKey && !input.clearMedia;
    const body =
      input.body.trim() || (input.media || keptMedia ? 'Shared a moment 🐾' : '');
    if (body.length < 2) {
      Alert.alert('Add something', 'Write a caption or attach a photo or video.');
      return;
    }

    setPosting(true);
    let mediaKey: string | null | undefined;
    let postType: GlobalPostType | undefined;
    if (input.media) {
      const key = await uploadCommunityMedia(
        userId,
        input.media.uri,
        input.media.kind,
        input.media.mimeType,
      );
      if (!key) {
        setPosting(false);
        Alert.alert('Upload failed', 'Could not upload that file.');
        return;
      }
      mediaKey = key;
      postType = input.media.kind === 'video' ? 'video' : 'photo';
    } else if (input.clearMedia) {
      mediaKey = null;
      postType = body.includes('?') ? 'question' : 'text';
    } else if (composer.mode === 'create') {
      postType = body.includes('?') ? 'question' : 'text';
    }

    const err =
      composer.mode === 'edit' && composer.post
        ? await updateGlobalPost({
            postId: composer.post.id,
            body,
            petName: input.petName,
            postType,
            mediaStorageKey: mediaKey,
          })
        : await createGlobalPost({
            authorId: userId,
            body,
            petName: input.petName.trim() || undefined,
            postType,
            mediaStorageKey: mediaKey ?? undefined,
          });
    setPosting(false);
    if (err) {
      Alert.alert(composer.mode === 'edit' ? 'Could not save' : 'Could not post', err);
      return;
    }
    setComposer(null);
    void reload();
  };

  const confirmDelete = (post: GlobalPost) => {
    Alert.alert('Delete post?', 'This removes the post for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteGlobalPost(post.id).then((err) => {
            if (err) Alert.alert('Could not delete', err);
            else void reload();
          });
        },
      },
    ]);
  };

  const openPostMenu = (post: GlobalPost) => {
    const isOwner = post.authorId === userId;
    if (isOwner) {
      Alert.alert('Your post', undefined, [
        { text: 'Edit', onPress: () => setComposer({ mode: 'edit', post }) },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(post) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert('Post', undefined, [
      { text: 'Report', onPress: () => setReportPost(post) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitReport = async (reason: string, details: string) => {
    if (!userId || !reportPost) return;
    setPosting(true);
    const err = await reportGlobalPost({
      postId: reportPost.id,
      reporterId: userId,
      reason,
      details,
    });
    setPosting(false);
    if (err) {
      Alert.alert('Could not report', err);
      return;
    }
    setReportPost(null);
    Alert.alert('Report sent', 'Thanks. Our team will review this post.');
  };

  const openComments = async (postId: string) => {
    setCommentPostId(postId);
    setComments([]);
    const rows = await fetchComments(postId);
    setComments(rows);
  };

  const submitComment = async (body: string, parentId: string | null) => {
    if (!userId || !commentPostId) return;
    const err = await addComment(commentPostId, userId, body, parentId);
    if (err) {
      Alert.alert('Comment failed', err);
      return;
    }
    setComments(await fetchComments(commentPostId));
    void reload();
  };

  const listHeader = (
    <>
      <View style={styles.topRow}>
        <Text style={styles.title}>Community</Text>
        <View style={styles.topActions}>
          <Pressable onPress={() => Alert.alert('Coming soon', 'Notifications are coming soon.')}>
            <Feather name="bell" size={22} color="#111827" />
          </Pressable>
          <Pressable
            style={styles.plusBtn}
            accessibilityLabel="Create post"
            onPress={() => setComposer({ mode: 'create', post: null })}>
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.hero}>
        <FontAwesome name="globe" size={22} color={BRAND} style={styles.heroGlobe} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Basera Community</Text>
          <Text style={styles.heroMeta}>{formatMemberCount(Math.max(memberCount, 1))} Pet Parents</Text>
          <Text style={styles.heroSub}>Everyone on Basera · Global feed</Text>
        </View>
        <Image source={HOME_IMAGES.pets.goldenRetriever} style={styles.heroDog} contentFit="cover" />
      </View>

      <View style={styles.comingSoonBar}>
        <Text style={styles.comingSoonText}>
          Packs, meetups & local groups — coming soon
        </Text>
      </View>
    </>
  );

  return (
    <ImageBackground
      source={WEB_IMAGES.communityBg}
      style={[styles.screen, { paddingTop: insets.top + 8 }]}
      imageStyle={styles.screenBgImage}>
      <View style={styles.screenWash} pointerEvents="none" />
      {loading ? (
        <ActivityIndicator color={BRAND} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={feedRows}
          keyExtractor={(row) => row.key}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          renderItem={({ item }) => {
            if (item.kind === 'date') {
              return <DateSeparator label={item.label} />;
            }
            const authorLabel = displayAuthorName(
              item.post.authorId,
              item.post.author?.name,
              userId,
            );
            return (
              <PostCard
                post={item.post}
                authorLabel={authorLabel}
                onMenu={() => openPostMenu(item.post)}
                onOpenMedia={setMediaPreview}
                onLike={() => {
                  if (!userId) return;
                  void togglePostLike(item.post.id, userId, Boolean(item.post.likedByMe)).then(() =>
                    reload(),
                  );
                }}
                onComment={() => void openComments(item.post.id)}
                onShare={() =>
                  void Share.share({ message: `${authorLabel}: ${item.post.body}` }).catch(() => {})
                }
              />
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>No posts yet. Be the first to share with the community!</Text>
          }
        />
      )}

      <ComposePostModal
        visible={composer != null}
        mode={composer?.mode ?? 'create'}
        initial={composer?.post ?? null}
        posting={posting}
        onClose={() => {
          if (!posting) setComposer(null);
        }}
        onSubmit={(input) => void submitComposer(input)}
      />

      <ReportPostModal
        visible={reportPost != null}
        posting={posting}
        onClose={() => {
          if (!posting) setReportPost(null);
        }}
        onSubmit={(reason, details) => void submitReport(reason, details)}
      />

      <MediaPreviewModal preview={mediaPreview} onClose={() => setMediaPreview(null)} />

      <CommentsSheet
        visible={commentPostId != null}
        userId={userId}
        myPhotoUri={profile?.photoUri}
        comments={comments}
        onClose={() => {
          setCommentPostId(null);
          setComments([]);
        }}
        onSubmit={submitComment}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F7FC' },
  screenBgImage: { opacity: 0.55 },
  screenWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 247, 252, 0.72)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontFamily: FONT_FAMILY, fontSize: 26, fontWeight: '700', color: '#111827' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    padding: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
    minHeight: 100,
  },
  heroGlobe: { marginTop: 4 },
  heroCopy: { flex: 1, paddingLeft: 10, zIndex: 2 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  heroMeta: { marginTop: 4, fontSize: 14, fontWeight: '600', color: BRAND },
  heroSub: { marginTop: 2, fontSize: 12, color: '#6B7280' },
  heroDog: {
    position: 'absolute',
    right: 8,
    bottom: 0,
    width: 88,
    height: 88,
    borderRadius: 12,
  },
  composeSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    maxHeight: '92%',
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  composeInput: {
    backgroundColor: '#F8F7FC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 110,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  composePreview: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  composePreviewMedia: { width: '100%', height: 180 },
  composeAdjust: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.72)',
  },
  composeAdjustText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cropHost: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
  },
  composeRemoveMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportHint: { fontSize: 14, color: '#6B7280', marginBottom: 10 },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reasonChipActive: { backgroundColor: '#EDE9FE', borderColor: BRAND },
  reasonChipTextActive: { color: BRAND },
  reportSubmit: { alignSelf: 'flex-end', marginTop: 8 },
  petInput: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  postBtn: {
    marginLeft: 'auto',
    backgroundColor: BRAND,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 72,
    alignItems: 'center',
  },
  postBtnText: { color: '#FFFFFF', fontWeight: '700' },
  comingSoonBar: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  comingSoonText: { fontSize: 12, color: '#9A3412', textAlign: 'center' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#9CA3AF',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  postHeaderText: { flex: 1 },
  postAuthor: { fontSize: 15, fontWeight: '700', color: '#111827' },
  postPet: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  postTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  postBody: { marginTop: 10, fontSize: 15, lineHeight: 22, color: '#111827' },
  postMediaWrap: {
    marginTop: 12,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMedia: {
    width: '100%',
    height: Math.min(Dimensions.get('window').width * 0.85, 420),
    backgroundColor: '#111827',
  },
  playBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.28)',
  },
  playBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreviewRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaPreviewClose: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreviewImageWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mediaPreviewVideo: {
    width: '100%',
    height: '80%',
  },
  postActions: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'center' },
  likeWrap: { position: 'relative', overflow: 'visible' },
  floatHeartLayer: {
    position: 'absolute',
    left: 10,
    bottom: 28,
    width: 1,
    height: 1,
    overflow: 'visible',
  },
  floatHeart: { position: 'absolute' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  actionBtnLiked: { backgroundColor: '#FFE4EF' },
  actionText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  actionTextLiked: { color: '#E11D48' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 24 },
  commentsModalRoot: { flex: 1, justifyContent: 'flex-end' },
  commentsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  commentsSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    maxHeight: '88%',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  commentsTitle: { fontSize: 22, fontWeight: '800', color: '#111827', flexShrink: 1 },
  commentsCount: { fontWeight: '700', color: '#6B7280' },
  commentsSort: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    padding: 4,
    gap: 2,
  },
  commentsSortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  commentsSortActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  commentsSortText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  commentsSortTextActive: { color: '#111827' },
  commentsComposer: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  commentsInputWrap: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 44,
    minHeight: 96,
  },
  commentsReplying: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  commentsReplyingText: { fontSize: 12, color: '#6B7280' },
  commentsReplyingName: { fontWeight: '700', color: '#111827' },
  commentsReplyingCancel: { fontSize: 12, fontWeight: '700', color: BRAND },
  commentsInput: {
    fontSize: 15,
    color: '#111827',
    minHeight: 56,
    textAlignVertical: 'top',
    padding: 0,
  },
  commentsSend: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsSendDisabled: { opacity: 0.45 },
  commentsList: { marginTop: 4 },
  commentsEmpty: {
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 28,
    fontSize: 14,
  },
  cmt: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1F2F4',
  },
  cmtReply: {
    paddingTop: 12,
    paddingBottom: 0,
    borderTopWidth: 0,
  },
  cmtMain: { flex: 1, minWidth: 0 },
  cmtHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cmtMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 8, flex: 1 },
  cmtName: { fontSize: 15, fontWeight: '800', color: '#111827' },
  cmtDate: { fontSize: 12, color: '#9CA3AF' },
  cmtBody: { marginTop: 4, fontSize: 14, lineHeight: 21, color: '#1F2937' },
  cmtTranslate: { marginTop: 4, marginBottom: 8, fontSize: 13, fontWeight: '600', color: '#A5B4FC' },
  cmtActions: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  cmtAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cmtActionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  cmtActionActive: { color: BRAND },
  cmtRepliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  cmtRepliesToggleText: { fontSize: 13, fontWeight: '700', color: BRAND },
});
