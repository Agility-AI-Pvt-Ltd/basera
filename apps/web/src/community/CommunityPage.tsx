import { AVATAR_PRESETS, BRAND_IMAGES, WEB_IMAGES } from '@basera/assets/web';
import {
  displayAuthorName,
  feedDayKey,
  formatFeedDateLabel,
  formatMemberCount,
  isCommunityVideoMedia,
  POST_REPORT_REASONS,
  PRESET_AVATAR_IDS,
  presetAvatarUri,
  type GlobalComment,
  type GlobalPost,
  type GlobalPostType,
  type PresetAvatarId,
} from '@basera/shared';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Film,
  Flag,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreVertical,
  Pencil,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import {
  addComment,
  createGlobalPost,
  deleteGlobalPost,
  fetchComments,
  fetchGlobalPosts,
  fetchMemberCount,
  fetchProfilePreview,
  reportGlobalPost,
  saveWebCommunityProfile,
  subscribeGlobalCommunity,
  togglePostLike,
  updateGlobalPost,
  uploadCommunityFile,
  uploadProfilePhotoFile,
} from '../lib/globalCommunity';
import { PhotoAdjust } from './PhotoAdjust';
import { verifyEmailOtp } from '../lib/auth';
import { isValidEmail, normalizeEmail } from '../lib/email';
import { supabase } from '../lib/supabase';
import './community.css';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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

function postTitle(post: GlobalPost): string {
  const line = post.body.trim().split(/\n/)[0] ?? '';
  if (line.length <= 90) return line || 'Community update';
  return `${line.slice(0, 87)}…`;
}

function postSnippet(post: GlobalPost): string {
  const body = post.body.trim();
  const title = postTitle(post);
  if (body === title) return '';
  return body.length > title.length ? body.slice(title.length).trim() : body;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
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

function AuthPanel({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    const normalized = normalizeEmail(email);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        // Hosted Auth still needs Magic Link template + custom SMTP for OTP mail.
        emailRedirectTo: `${window.location.origin}/community`,
      },
    });
    setLoading(false);
    if (err) setError(err.message);
    else {
      setEmail(normalized);
      setStep('otp');
    }
  };

  const verify = async () => {
    setLoading(true);
    setError('');
    const { error: verifyError } = await verifyEmailOtp(email, otp);
    setLoading(false);
    if (verifyError) setError(verifyError);
    else onAuthed();
  };

  return (
    <div
      className="community-auth-wrap"
      style={{ backgroundImage: `url(${WEB_IMAGES.communityBg})` }}>
      <div className="community-auth">
        <div className="bc-brand" style={{ marginBottom: 16 }}>
          <img className="bc-brand-mark" src={BRAND_IMAGES.logo} alt="" />
          <span>Basera</span>
        </div>
        <h1>Join the community</h1>
        <p className="community-muted">Sign in with OTP — session lasts up to 1 week.</p>
        {step === 'email' ? (
          <>
            <input
              className="community-input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="button"
              className="community-btn"
              disabled={loading}
              aria-busy={loading}
              onClick={() => void sendOtp()}>
              {loading ? (
                <>
                  <Loader2 className="community-btn-spinner" size={18} aria-hidden />
                  Sending code…
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </>
        ) : (
          <>
            <input
              className="community-input"
              placeholder="6-digit OTP"
              value={otp}
              disabled={loading}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button
              type="button"
              className="community-btn"
              disabled={loading || otp.replace(/\D/g, '').length < 6}
              aria-busy={loading}
              onClick={() => void verify()}>
              {loading ? (
                <>
                  <Loader2 className="community-btn-spinner" size={18} aria-hidden />
                  Verifying…
                </>
              ) : (
                'Verify & join'
              )}
            </button>
            <button
              type="button"
              className="community-link-btn"
              style={{ marginTop: 12 }}
              disabled={loading}
              onClick={() => void sendOtp()}>
              Resend code
            </button>
          </>
        )}
        {error ? <p className="community-error">{error}</p> : null}
        <p className="community-footnote">
          Adoption, training, nutrition & more — open the Basera mobile app.
        </p>
      </div>
    </div>
  );
}

function ProfileSetupPanel({
  userId,
  initialName,
  onDone,
}: {
  userId: string;
  initialName?: string;
  onDone: () => void;
}) {
  const [name, setName] = useState(initialName?.trim() ?? '');
  const [presetId, setPresetId] = useState<PresetAvatarId>('avatar-01');
  const [mode, setMode] = useState<'preset' | 'upload'>('preset');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uploadFile) {
      setUploadPreview(null);
      return;
    }
    const url = URL.createObjectURL(uploadFile);
    setUploadPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadFile]);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Enter your name (at least 2 characters).');
      return;
    }
    if (mode === 'upload' && !uploadFile) {
      setError('Choose a profile photo, or pick an avatar.');
      return;
    }

    setLoading(true);
    setError('');
    let photoUri = presetAvatarUri(presetId);
    if (mode === 'upload' && uploadFile) {
      const key = await uploadProfilePhotoFile(userId, uploadFile);
      if (!key) {
        setLoading(false);
        setError('Could not upload that photo. Try again or pick an avatar.');
        return;
      }
      photoUri = key;
    }

    const err = await saveWebCommunityProfile({ userId, name: trimmed, photoUri });
    setLoading(false);
    if (err) setError(err);
    else onDone();
  };

  return (
    <div
      className="community-auth-wrap"
      style={{ backgroundImage: `url(${WEB_IMAGES.communityBg})` }}>
      <div className="community-auth community-profile-setup">
        <div className="bc-brand" style={{ marginBottom: 16 }}>
          <img className="bc-brand-mark" src={BRAND_IMAGES.logo} alt="" />
          <span>Basera</span>
        </div>
        <h1>Set up your profile</h1>
        <p className="community-muted">
          Choose a name and avatar for the community. You can finish the rest in the Basera app
          later.
        </p>

        <label className="community-field-label" htmlFor="community-profile-name">
          Display name
        </label>
        <input
          id="community-profile-name"
          className="community-input"
          placeholder="Your name"
          autoComplete="name"
          value={name}
          disabled={loading}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="community-avatar-tabs" role="tablist" aria-label="Avatar source">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preset'}
            className={mode === 'preset' ? 'is-active' : undefined}
            disabled={loading}
            onClick={() => setMode('preset')}>
            Avatar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'upload'}
            className={mode === 'upload' ? 'is-active' : undefined}
            disabled={loading}
            onClick={() => setMode('upload')}>
            Photo
          </button>
        </div>

        {mode === 'preset' ? (
          <div className="community-avatar-grid" role="listbox" aria-label="Choose an avatar">
            {PRESET_AVATAR_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={presetId === id}
                className={`community-avatar-option${presetId === id ? ' is-selected' : ''}`}
                disabled={loading}
                onClick={() => setPresetId(id)}>
                <img src={AVATAR_PRESETS[id]} alt="" />
              </button>
            ))}
          </div>
        ) : (
          <div className="community-avatar-upload">
            {uploadPreview ? (
              <img className="community-avatar-upload-preview" src={uploadPreview} alt="" />
            ) : (
              <div className="community-avatar-upload-placeholder">Add a photo</div>
            )}
            <label className="community-file-btn">
              <input
                type="file"
                accept="image/*"
                disabled={loading}
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile ? 'Change photo' : 'Upload photo'}
            </label>
          </div>
        )}

        <button
          type="button"
          className="community-btn"
          disabled={loading}
          aria-busy={loading}
          onClick={() => void save()}>
          {loading ? (
            <>
              <Loader2 className="community-btn-spinner" size={18} aria-hidden />
              Saving…
            </>
          ) : (
            'Continue to community'
          )}
        </button>
        {error ? <p className="community-error">{error}</p> : null}
      </div>
    </div>
  );
}

function Avatar({
  name,
  photoUri,
  className,
}: {
  name: string;
  photoUri?: string | null;
  className: string;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [photoUri]);

  if (photoUri && !broken) {
    return (
      <span className={className}>
        <img src={photoUri} alt="" onError={() => setBroken(true)} />
      </span>
    );
  }
  return <span className={className}>{initials(name)}</span>;
}

type MediaPreview = { url: string; kind: 'image' | 'video' };

function MediaLightbox({
  preview,
  onClose,
}: {
  preview: MediaPreview;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (preview.kind === 'video') {
      void videoRef.current?.play().catch(() => {});
    }
  }, [preview]);

  return (
    <div
      className="bc-media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={preview.kind === 'video' ? 'Video player' : 'Image preview'}
      onClick={onClose}>
      <button type="button" className="bc-media-lightbox-close" aria-label="Close" onClick={onClose}>
        ×
      </button>
      {preview.kind === 'video' ? (
        <video
          ref={videoRef}
          src={preview.url}
          controls
          autoPlay
          playsInline
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img src={preview.url} alt="" onClick={(e) => e.stopPropagation()} />
      )}
    </div>
  );
}

function PostMedia({
  post,
  onOpen,
}: {
  post: GlobalPost;
  onOpen: (preview: MediaPreview) => void;
}) {
  if (!post.mediaUrl) return null;
  const isVideo = isCommunityVideoMedia(post);

  if (isVideo) {
    return (
      <button
        type="button"
        className="bc-post-media video"
        onClick={() => onOpen({ url: post.mediaUrl!, kind: 'video' })}
        aria-label="Play video fullscreen">
        <video src={post.mediaUrl} muted preload="metadata" playsInline />
        <span className="bc-play-badge" aria-hidden>
          <span>▶</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="bc-post-media"
      onClick={() => onOpen({ url: post.mediaUrl!, kind: 'image' })}
      aria-label="Preview image">
      <img src={post.mediaUrl} alt="" />
    </button>
  );
}

type FloatHeart = { id: number; left: number; delay: number; drift: number; size: number };

function PostReactions({
  post,
  onLike,
  onComment,
  onShare,
}: {
  post: GlobalPost;
  onLike: () => void | Promise<void>;
  onComment: () => void;
  onShare: () => void;
}) {
  const [hearts, setHearts] = useState<FloatHeart[]>([]);
  const burstId = useRef(0);

  const handleLike = () => {
    if (!post.likedByMe) {
      const next: FloatHeart[] = Array.from({ length: 8 }, () => {
        burstId.current += 1;
        return {
          id: burstId.current,
          left: 28 + Math.random() * 44,
          delay: Math.random() * 0.18,
          drift: -28 + Math.random() * 56,
          size: 12 + Math.random() * 10,
        };
      });
      setHearts((prev) => [...prev, ...next]);
      window.setTimeout(() => {
        setHearts((prev) => prev.filter((h) => !next.some((n) => n.id === h.id)));
      }, 1100);
    }
    void onLike();
  };

  return (
    <div className="bc-post-actions">
      <div className="bc-like-wrap">
        <button
          type="button"
          className={`bc-action bc-like-btn ${post.likedByMe ? 'liked' : ''}`}
          aria-label={post.likedByMe ? 'Unlike' : 'Like'}
          onClick={handleLike}>
          <Heart
            size={18}
            strokeWidth={2.25}
            fill={post.likedByMe ? 'currentColor' : 'none'}
          />
          <span>{post.likeCount}</span>
        </button>
        <span className="bc-float-hearts" aria-hidden>
          {hearts.map((h) => (
            <Heart
              key={h.id}
              className="bc-float-heart"
              size={h.size}
              fill="currentColor"
              strokeWidth={0}
              style={
                {
                  '--float-left': `${h.left}%`,
                  '--float-delay': `${h.delay}s`,
                  '--float-drift': `${h.drift}px`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      </div>
      <button type="button" className="bc-action" onClick={onComment} aria-label="Comments">
        <MessageCircle size={18} strokeWidth={2.25} />
        <span>{post.commentCount}</span>
      </button>
      <button type="button" className="bc-action" onClick={onShare} aria-label="Share">
        <Share2 size={18} strokeWidth={2.25} />
        <span>Share</span>
      </button>
    </div>
  );
}

type CommentVote = 'up' | 'down' | null;

function CommentsPanel({
  postId,
  userId,
  myName,
  myPhotoUri,
  comments,
  onClose,
  onRefresh,
  onFeedReload,
}: {
  postId: string;
  userId: string;
  myName: string;
  myPhotoUri: string | null;
  comments: GlobalComment[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onFeedReload: () => void;
}) {
  const [sort, setSort] = useState<'popular' | 'newest'>('newest');
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<GlobalComment | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; mine: CommentVote }>>(
    {},
  );
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

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
    const err = await addComment(postId, userId, draft, replyTo?.id ?? null);
    setSending(false);
    if (err) {
      alert(err);
      return;
    }
    setDraft('');
    setReplyTo(null);
    await onRefresh();
    onFeedReload();
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
      <article key={comment.id} className={`bc-cmt ${isReply ? 'reply' : ''}`}>
        <Avatar name={name} photoUri={comment.author?.photoUri} className="bc-cmt-avatar" />
        <div className="bc-cmt-main">
          <header className="bc-cmt-head">
            <div className="bc-cmt-meta">
              <strong>{name}</strong>
              <span>{formatCommentDate(comment.createdAt)}</span>
            </div>
            <button type="button" className="bc-cmt-more" aria-label="More" onClick={() => alert('Coming soon')}>
              <MoreVertical size={16} />
            </button>
          </header>
          <p className="bc-cmt-body">{comment.body}</p>
          <button type="button" className="bc-cmt-translate" onClick={() => alert('Translate — coming soon')}>
            Translate
          </button>
          <div className="bc-cmt-actions">
            <button
              type="button"
              className={v.mine === 'up' ? 'active' : ''}
              onClick={() => toggleVote(comment.id, 'up')}>
              <ThumbsUp size={15} strokeWidth={2.2} fill={v.mine === 'up' ? 'currentColor' : 'none'} />
              <span>{v.up}</span>
            </button>
            <button
              type="button"
              className={v.mine === 'down' ? 'active' : ''}
              onClick={() => toggleVote(comment.id, 'down')}>
              <ThumbsDown size={15} strokeWidth={2.2} fill={v.mine === 'down' ? 'currentColor' : 'none'} />
              <span>{v.down}</span>
            </button>
            <button type="button" onClick={() => startReply(comment)}>
              <MessageCircle size={15} strokeWidth={2.2} />
              <span>Reply</span>
            </button>
          </div>
          {!isReply && replies.length > 0 ? (
            <button
              type="button"
              className="bc-cmt-replies-toggle"
              onClick={() =>
                setExpanded((prev) => {
                  const next = new Set(prev);
                  if (next.has(comment.id)) next.delete(comment.id);
                  else next.add(comment.id);
                  return next;
                })
              }>
              {open ? 'Hide' : 'See'} {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : null}
          {open
            ? replies.map((r) => renderComment(r, true))
            : null}
        </div>
      </article>
    );
  };

  return (
    <div className="bc-comments-modal" role="dialog" aria-modal="true" aria-label="Comments">
      <button type="button" className="bc-comments-backdrop" aria-label="Close comments" onClick={onClose} />
      <div className="bc-comments-sheet">
        <header className="bc-comments-header">
          <h3>
            Comments <span>({formatCommentCount(comments.length)})</span>
          </h3>
          <div className="bc-comments-sort" role="tablist" aria-label="Sort comments">
            <button
              type="button"
              role="tab"
              aria-selected={sort === 'popular'}
              className={sort === 'popular' ? 'active' : ''}
              onClick={() => setSort('popular')}>
              <TrendingUp size={14} />
              Popular
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sort === 'newest'}
              className={sort === 'newest' ? 'active' : ''}
              onClick={() => setSort('newest')}>
              <CalendarDays size={14} />
              Newest
            </button>
          </div>
        </header>

        <div className="bc-comments-composer">
          <Avatar name={myName} photoUri={myPhotoUri} className="bc-cmt-avatar" />
          <div className="bc-comments-input-wrap">
            {replyTo ? (
              <div className="bc-comments-replying">
                Replying to{' '}
                <strong>{displayAuthorName(replyTo.authorId, replyTo.author?.name, userId)}</strong>
                <button type="button" onClick={() => setReplyTo(null)}>
                  Cancel
                </button>
              </div>
            ) : null}
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write your comments here..."
              rows={3}
            />
            <button
              type="button"
              className="bc-comments-send"
              aria-label="Send comment"
              disabled={sending || draft.trim().length < 1}
              onClick={() => void submit()}>
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="bc-comments-list">
          {roots.length === 0 ? (
            <p className="bc-comments-empty">No comments yet. Start the conversation.</p>
          ) : (
            roots.map((c) => renderComment(c))
          )}
        </div>
      </div>
    </div>
  );
}

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

type ComposerDraft = {
  body: string;
  petName: string;
  file: File | null;
  previewUrl: string | null;
  kind: 'image' | 'video' | null;
  clearMedia: boolean;
};

function emptyDraft(post?: GlobalPost | null): ComposerDraft {
  return {
    body: post?.body ?? '',
    petName: post?.petName ?? '',
    file: null,
    previewUrl: null,
    kind: null,
    clearMedia: false,
  };
}

function ComposeModal({
  mode,
  initial,
  posting,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initial: GlobalPost | null;
  posting: boolean;
  onClose: () => void;
  onSubmit: (draft: ComposerDraft) => void;
}) {
  const [draft, setDraft] = useState<ComposerDraft>(() => emptyDraft(initial));
  const [adjustFile, setAdjustFile] = useState<File | null>(null);
  const [photoSource, setPhotoSource] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(emptyDraft(initial));
    setAdjustFile(null);
    setPhotoSource(null);
  }, [initial]);

  const attach = (file: File | undefined, kind: 'image' | 'video') => {
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      alert('That file is larger than 50 MB.');
      return;
    }
    setDraft((prev) => {
      if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        ...prev,
        file,
        kind,
        previewUrl: URL.createObjectURL(file),
        clearMedia: false,
      };
    });
  };

  const existingUrl = !draft.clearMedia && !draft.file ? initial?.mediaUrl : null;
  const existingKind = initial && isCommunityVideoMedia(initial) ? 'video' : 'image';
  const canSubmit =
    !posting && (draft.body.trim().length >= 2 || Boolean(draft.file) || Boolean(existingUrl));

  return (
    <div className="bc-compose-modal" role="dialog" aria-modal="true" aria-label={mode === 'edit' ? 'Edit post' : 'New post'}>
      <button type="button" className="bc-comments-backdrop" aria-label="Close" onClick={onClose} />
      <div className="bc-compose-sheet">
        <header className="bc-compose-head">
          <h3>{mode === 'edit' ? 'Edit post' : 'New post'}</h3>
          <button type="button" className="bc-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <textarea
          value={draft.body}
          onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
          placeholder="Share a moment, ask a question, or post a tip..."
          autoFocus
        />
        <input
          value={draft.petName}
          onChange={(e) => setDraft((prev) => ({ ...prev, petName: e.target.value }))}
          placeholder="Pet name (optional)"
        />
        {draft.previewUrl && draft.kind ? (
          <div className="bc-compose-preview">
            {draft.kind === 'video' ? (
              <video src={draft.previewUrl} muted controls />
            ) : (
              <img src={draft.previewUrl} alt="" />
            )}
            {draft.kind === 'image' && photoSource ? (
              <button type="button" className="bc-compose-adjust" onClick={() => setAdjustFile(photoSource)}>
                Adjust
              </button>
            ) : null}
            <button
              type="button"
              className="bc-compose-remove"
              aria-label="Remove media"
              onClick={() => {
                setPhotoSource(null);
                setDraft((prev) => {
                  if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
                  return { ...prev, file: null, previewUrl: null, kind: null };
                });
              }}>
              <X size={14} />
            </button>
          </div>
        ) : existingUrl ? (
          <div className="bc-compose-preview">
            {existingKind === 'video' ? <video src={existingUrl} muted /> : <img src={existingUrl} alt="" />}
            <button
              type="button"
              className="bc-compose-remove"
              aria-label="Remove media"
              onClick={() => setDraft((prev) => ({ ...prev, clearMedia: true }))}>
              <X size={14} />
            </button>
          </div>
        ) : null}
        <div className="bc-composer-actions">
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              if (file.size > MAX_MEDIA_BYTES) {
                alert('That file is larger than 50 MB.');
                return;
              }
              setPhotoSource(file);
              setAdjustFile(file);
            }}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            hidden
            onChange={(e) => {
              attach(e.target.files?.[0], 'video');
              e.target.value = '';
            }}
          />
          <button type="button" className="bc-chip" onClick={() => photoRef.current?.click()}>
            <ImageIcon size={14} /> Photo
          </button>
          <button type="button" className="bc-chip" onClick={() => videoRef.current?.click()}>
            <Film size={14} /> Video
          </button>
          <button type="button" className="community-link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn"
            disabled={!canSubmit}
            onClick={() => onSubmit(draft)}>
            {posting ? 'Saving…' : mode === 'edit' ? 'Save' : 'Post'}
          </button>
        </div>
      </div>
      {adjustFile ? (
        <PhotoAdjust
          file={adjustFile}
          onCancel={() => setAdjustFile(null)}
          onConfirm={(cropped) => {
            attach(cropped, 'image');
            setAdjustFile(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ReportModal({
  posting,
  onClose,
  onSubmit,
}: {
  posting: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}) {
  const [reason, setReason] = useState<string>(POST_REPORT_REASONS[0]);
  const [details, setDetails] = useState('');

  return (
    <div className="bc-compose-modal" role="dialog" aria-modal="true" aria-label="Report post">
      <button type="button" className="bc-comments-backdrop" aria-label="Close" onClick={onClose} />
      <div className="bc-compose-sheet">
        <header className="bc-compose-head">
          <h3>Report post</h3>
          <button type="button" className="bc-icon-btn" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <p className="community-muted">Why are you reporting this post?</p>
        <div className="bc-reason-list">
          {POST_REPORT_REASONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`bc-chip ${reason === item ? 'active' : ''}`}
              onClick={() => setReason(item)}>
              {item}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Add details (optional)"
          rows={3}
        />
        <div className="bc-composer-actions">
          <button type="button" className="community-link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn"
            disabled={posting}
            onClick={() => onSubmit(reason, details)}>
            {posting ? 'Sending…' : 'Submit report'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommunityPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [posts, setPosts] = useState<GlobalPost[]>([]);
  const [members, setMembers] = useState(0);
  const [posting, setPosting] = useState(false);
  const [composer, setComposer] = useState<null | { mode: 'create' | 'edit'; post: GlobalPost | null }>(
    null,
  );
  const [reportPost, setReportPost] = useState<GlobalPost | null>(null);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [nav, setNav] = useState<'foryou' | 'following' | 'packs'>('foryou');
  const [recentCleared, setRecentCleared] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<GlobalComment[]>([]);
  const [myProfile, setMyProfile] = useState<{ name: string; photoUri: string | null }>({
    name: 'You',
    photoUri: null,
  });
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfileReady(false);
      setProfileChecked(false);
      setMyProfile({ name: 'You', photoUri: null });
      return;
    }
    setProfileChecked(false);
    void fetchProfilePreview(userId).then((p) => {
      if (p) {
        setMyProfile({ name: p.name, photoUri: p.photoUri });
        setProfileReady(p.ready);
      } else {
        setMyProfile({ name: 'You', photoUri: null });
        setProfileReady(false);
      }
      setProfileChecked(true);
    });
  }, [userId]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const name = displayAuthorName(p.authorId, p.author?.name, userId).toLowerCase();
      return p.body.toLowerCase().includes(q) || name.includes(q) || (p.petName ?? '').toLowerCase().includes(q);
    });
  }, [posts, search, userId]);

  const feedRows = useMemo(() => buildFeedRows(filteredPosts), [filteredPosts]);
  const recentPosts = useMemo(() => (recentCleared ? [] : posts.slice(0, 6)), [posts, recentCleared]);

  const reload = useCallback(async () => {
    const [nextPosts, count] = await Promise.all([fetchGlobalPosts(userId), fetchMemberCount()]);
    setPosts(nextPosts);
    setMembers(count);
  }, [userId]);

  useEffect(() => {
    if (!ready || !userId || !profileReady) return;
    void reload();
  }, [ready, userId, profileReady, reload]);

  useEffect(() => {
    if (!userId || !profileReady) return;
    return subscribeGlobalCommunity(() => void reload());
  }, [userId, profileReady, reload]);

  const openCreate = () => {
    setMenuPostId(null);
    setComposer({ mode: 'create', post: null });
    setNav('foryou');
  };

  useEffect(() => {
    if (!menuPostId) return;
    const close = () => setMenuPostId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuPostId]);

  const soon = (label: string) => alert(`${label} — coming soon.`);

  if (!ready) return <div className="bc-loading">Loading community…</div>;
  if (!userId) {
    return (
      <AuthPanel
        onAuthed={() =>
          supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null))
        }
      />
    );
  }
  if (!profileChecked) return <div className="bc-loading">Loading community…</div>;
  if (!profileReady) {
    return (
      <ProfileSetupPanel
        userId={userId}
        initialName={myProfile.name !== 'You' ? myProfile.name : ''}
        onDone={() => {
          void fetchProfilePreview(userId).then((p) => {
            if (p) {
              setMyProfile({ name: p.name, photoUri: p.photoUri });
              setProfileReady(p.ready);
            }
          });
        }}
      />
    );
  }

  const submitComposer = async (draft: ComposerDraft) => {
    if (!composer) return;
    const keptMedia = composer.mode === 'edit' && composer.post?.mediaStorageKey && !draft.clearMedia;
    const body = draft.body.trim() || (draft.file || keptMedia ? 'Shared a moment 🐾' : '');
    if (body.length < 2) {
      alert('Write a caption or attach a photo or video.');
      return;
    }

    setPosting(true);
    let mediaKey: string | null | undefined;
    let postType: GlobalPostType | undefined;
    if (draft.file) {
      const uploaded = await uploadCommunityFile(userId, draft.file);
      if (!uploaded) {
        setPosting(false);
        alert('Could not upload that file.');
        return;
      }
      mediaKey = uploaded.key;
      postType = uploaded.kind === 'video' ? 'video' : 'photo';
    } else if (draft.clearMedia) {
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
            petName: draft.petName,
            postType,
            mediaStorageKey: mediaKey,
          })
        : await createGlobalPost({
            authorId: userId,
            body,
            petName: draft.petName.trim() || undefined,
            postType,
            mediaStorageKey: mediaKey ?? undefined,
          });
    setPosting(false);
    if (err) {
      alert(err);
      return;
    }
    setComposer(null);
    setRecentCleared(false);
    void reload();
  };

  const removePost = async (post: GlobalPost) => {
    if (!window.confirm('Delete this post? This removes it for everyone.')) return;
    const err = await deleteGlobalPost(post.id);
    if (err) {
      alert(err);
      return;
    }
    setMenuPostId(null);
    void reload();
  };

  const submitReport = async (reason: string, details: string) => {
    if (!reportPost) return;
    setPosting(true);
    const err = await reportGlobalPost({
      postId: reportPost.id,
      reporterId: userId,
      reason,
      details,
    });
    setPosting(false);
    if (err) {
      alert(err);
      return;
    }
    setReportPost(null);
    alert('Report sent. Our team will review this post.');
  };

  const myLabel = 'You';

  return (
    <div
      className="community-shell"
      style={{ backgroundImage: `url(${WEB_IMAGES.communityBg})` }}>
      <header className="bc-topnav">
        <Link to="/community" className="bc-brand">
          <img className="bc-brand-mark" src={BRAND_IMAGES.logo} alt="" />
          <span>Basera</span>
        </Link>

        <label className="bc-search">
          <span aria-hidden>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Basera"
            aria-label="Search Basera"
          />
        </label>

        <div className="bc-top-actions">
          <button type="button" className="bc-create-btn" onClick={openCreate}>
            + <span>Create</span>
          </button>
          <button type="button" className="bc-icon-btn" title="Messages" onClick={() => soon('Messages')}>
            💬
          </button>
          <button
            type="button"
            className="bc-icon-btn"
            title="Notifications"
            onClick={() => soon('Notifications')}>
            🔔
          </button>
          <button
            type="button"
            className="bc-avatar-btn"
            title="Sign out"
            onClick={() => void supabase.auth.signOut()}>
            {initials(myLabel)}
          </button>
        </div>
      </header>

      <div className="bc-body">
        <aside className="bc-left">
          <nav className="bc-nav-section" aria-label="Primary">
            <button
              type="button"
              className={`bc-nav-item ${nav === 'foryou' ? 'active' : ''}`}
              onClick={() => setNav('foryou')}>
              <span className="bc-nav-ico">⌂</span> For You
            </button>
            <button
              type="button"
              className="bc-nav-item soon"
              onClick={() => {
                setNav('following');
                soon('Following');
              }}>
              <span className="bc-nav-ico">☆</span> Following
              <span className="bc-nav-meta">Soon</span>
            </button>
            <button type="button" className="bc-nav-item soon" onClick={() => soon('Popular')}>
              <span className="bc-nav-ico">↗</span> Popular
              <span className="bc-nav-meta">Soon</span>
            </button>
          </nav>

          <div className="bc-nav-section">
            <h3>Discover</h3>
            <button
              type="button"
              className={`bc-nav-item soon ${nav === 'packs' ? 'active' : ''}`}
              onClick={() => {
                setNav('packs');
                soon('Packs');
              }}>
              <span className="bc-nav-ico">◎</span> Packs
              <span className="bc-nav-meta">Soon</span>
            </button>
            <button type="button" className="bc-nav-item soon" onClick={() => soon('Meetups')}>
              <span className="bc-nav-ico">📍</span> Meetups
              <span className="bc-nav-meta">Soon</span>
            </button>
            <button type="button" className="bc-nav-item soon" onClick={() => soon('Adoption stories')}>
              <span className="bc-nav-ico">🐾</span> Adoption
              <span className="bc-nav-meta">Soon</span>
            </button>
          </div>

          <div className="bc-member-card">
            <strong>Basera Community</strong>
            <span>{formatMemberCount(members || 1)} pet parents · global feed</span>
          </div>
        </aside>

        <main className="bc-main">
          <div className="bc-feed">
            {feedRows.length === 0 ? (
              <div className="bc-empty">
                {search.trim()
                  ? 'No posts match your search.'
                  : 'No posts yet. Hit Create to share with everyone.'}
              </div>
            ) : (
              feedRows.map((row) => {
                if (row.kind === 'date') {
                  return (
                    <div key={row.key} className="community-date-row">
                      <span className="community-date-line" />
                      <span className="community-date-label">{row.label}</span>
                      <span className="community-date-line" />
                    </div>
                  );
                }

                const { post } = row;
                const authorLabel = displayAuthorName(post.authorId, post.author?.name, userId);
                const snippet = postSnippet(post);
                const isOwn = post.authorId === userId;

                return (
                  <article key={post.id} className="bc-post">
                    <div className="bc-post-top">
                      <Avatar
                        name={authorLabel}
                        photoUri={post.author?.photoUri}
                        className="bc-post-avatar"
                      />
                      <div className="bc-post-meta">
                        <strong>{authorLabel}</strong>
                        {post.petName ? <span className="bc-time">· {post.petName}</span> : null}
                        <span className="bc-time">· {timeAgo(post.createdAt)}</span>
                      </div>
                      {!isOwn ? (
                        <button
                          type="button"
                          className="bc-follow-btn"
                          onClick={() => soon('Follow')}>
                          Follow +
                        </button>
                      ) : null}
                      <div className="bc-menu-wrap">
                        <button
                          type="button"
                          className="bc-icon-btn"
                          aria-label="Post menu"
                          aria-expanded={menuPostId === post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuPostId((current) => (current === post.id ? null : post.id));
                          }}>
                          ⋯
                        </button>
                        {menuPostId === post.id ? (
                          <div className="bc-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                            {isOwn ? (
                              <>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setMenuPostId(null);
                                    setComposer({ mode: 'edit', post });
                                  }}>
                                  <Pencil size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="danger"
                                  onClick={() => void removePost(post)}>
                                  <Trash2 size={14} /> Delete
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuPostId(null);
                                  setReportPost(post);
                                }}>
                                <Flag size={14} /> Report
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="bc-post-body">
                      <div>
                        <h2 className="bc-post-title">{postTitle(post)}</h2>
                        {snippet ? <p className="bc-post-text">{snippet}</p> : null}
                      </div>
                      <PostMedia post={post} onOpen={setMediaPreview} />
                    </div>

                    <PostReactions
                      post={post}
                      onLike={() =>
                        togglePostLike(post.id, userId, Boolean(post.likedByMe)).then(reload)
                      }
                      onComment={() => {
                        setCommentPostId(post.id);
                        setComments([]);
                        void fetchComments(post.id).then(setComments);
                      }}
                      onShare={() =>
                        void navigator.share?.({ text: `${authorLabel}: ${post.body}` })
                      }
                    />
                  </article>
                );
              })
            )}
          </div>
        </main>

        <aside className="bc-right">
          <div className="bc-panel">
            <div className="bc-panel-head">
              <h2>Recent posts</h2>
              <button type="button" onClick={() => setRecentCleared(true)}>
                Clear
              </button>
            </div>
            {recentPosts.length === 0 ? (
              <p className="community-muted">No recent posts.</p>
            ) : (
              recentPosts.map((post) => {
                const authorLabel = displayAuthorName(post.authorId, post.author?.name, userId);
                return (
                  <button
                    key={post.id}
                    type="button"
                    className="bc-recent-item"
                    onClick={() => {
                      setCommentPostId(post.id);
                      setComments([]);
                      void fetchComments(post.id).then(setComments);
                    }}>
                    <div>
                      <div className="bc-recent-meta">
                        {authorLabel} · {timeAgo(post.createdAt)}
                      </div>
                      <p className="bc-recent-title">{postTitle(post)}</p>
                      {postSnippet(post) ? (
                        <p className="bc-recent-snippet">{postSnippet(post)}</p>
                      ) : null}
                    </div>
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} alt="" className="bc-recent-thumb" />
                    ) : (
                      <span className="bc-recent-thumb placeholder">🐾</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <p className="bc-soon-note">Packs, meetups & events are coming soon on web.</p>
        </aside>
      </div>

      {composer ? (
        <ComposeModal
          mode={composer.mode}
          initial={composer.post}
          posting={posting}
          onClose={() => {
            if (!posting) setComposer(null);
          }}
          onSubmit={(draft) => void submitComposer(draft)}
        />
      ) : null}

      {reportPost ? (
        <ReportModal
          posting={posting}
          onClose={() => {
            if (!posting) setReportPost(null);
          }}
          onSubmit={(reason, details) => void submitReport(reason, details)}
        />
      ) : null}

      {mediaPreview ? <MediaLightbox preview={mediaPreview} onClose={() => setMediaPreview(null)} /> : null}

      {commentPostId ? (
        <CommentsPanel
          postId={commentPostId}
          userId={userId}
          myName={myProfile.name}
          myPhotoUri={myProfile.photoUri}
          comments={comments}
          onClose={() => {
            setCommentPostId(null);
            setComments([]);
          }}
          onRefresh={async () => {
            setComments(await fetchComments(commentPostId));
          }}
          onFeedReload={() => void reload()}
        />
      ) : null}
    </div>
  );
}
