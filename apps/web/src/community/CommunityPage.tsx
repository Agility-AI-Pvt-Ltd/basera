import {
  AVATAR_PRESETS,
  BRAND_IMAGES,
  WEB_IMAGES,
} from "@tailz-club/assets/web";
import {
  displayAuthorName,
  feedDayKey,
  formatEventPeopleCount,
  formatEventStartsAt,
  formatFeedDateLabel,
  formatMemberCount,
  formatPollRemaining,
  formatPollVoteCount,
  googleMapsUrl,
  hasTaggedLocation,
  isCommunityVideoMedia,
  isLiveCommunityEvent,
  isLiveCommunityPoll,
  openStreetMapEmbedUrl,
  POST_REPORT_REASONS,
  webCommunityPostMediaUrl,
  PRESET_AVATAR_IDS,
  presetAvatarUri,
  type GlobalComment,
  type GlobalEventRsvpStatus,
  type GlobalEventVisibility,
  type GlobalPost,
  type GlobalPostType,
  type PresetAvatarId,
} from "@tailz-club/shared";
import {
  BarChart2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Film,
  Flag,
  Globe2,
  Heart,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Moon,
  MoreVertical,
  Pencil,
  Send,
  Share2,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";

import {
  addComment,
  castGlobalPollVote,
  createGlobalEventPost,
  createGlobalPollPost,
  createGlobalPost,
  deleteGlobalPost,
  setGlobalEventRsvp,
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
} from "../lib/globalCommunity";
import { verifyEmailOtp } from "../lib/auth";
import { isValidEmail, normalizeEmail } from "../lib/email";
import { supabase } from "../lib/supabase";
import "./community.css";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCommentCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(count);
}

function postTitle(post: GlobalPost): string {
  const line = post.body.trim().split(/\n/)[0] ?? "";
  if (line.length <= 90) return line || "Community update";
  return `${line.slice(0, 87)}…`;
}

function postSnippet(post: GlobalPost): string {
  const body = post.body.trim();
  const title = postTitle(post);
  if (body === title) return "";
  return body.length > title.length ? body.slice(title.length).trim() : body;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

type FeedRow =
  | { kind: "date"; key: string; label: string }
  | { kind: "post"; key: string; post: GlobalPost };

function buildFeedRows(posts: GlobalPost[]): FeedRow[] {
  const rows: FeedRow[] = [];
  let lastDay: string | null = null;
  for (const post of posts) {
    const day = feedDayKey(post.createdAt);
    if (day !== lastDay) {
      rows.push({
        kind: "date",
        key: `date-${day}`,
        label: formatFeedDateLabel(post.createdAt),
      });
      lastDay = day;
    }
    rows.push({ kind: "post", key: post.id, post });
  }
  return rows;
}

function AuthPanel({ onAuthed }: { onAuthed: () => void }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    const normalized = normalizeEmail(email);
    // OTP-only sign-in: do not set emailRedirectTo — it adds magic links that prefetchers can burn.
    const { error: err } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (err) setError(err.message);
    else {
      setEmail(normalized);
      setStep("otp");
    }
  };

  const verify = async () => {
    setLoading(true);
    setError("");
    const { error: verifyError } = await verifyEmailOtp(email, otp);
    setLoading(false);
    if (verifyError) setError(verifyError);
    else onAuthed();
  };

  return (
    <div
      className="community-auth-wrap"
      style={{ backgroundImage: `url(${WEB_IMAGES.communityBg})` }}
    >
      <div className="community-auth">
        <div className="bc-brand" style={{ marginBottom: 16 }}>
          <img className="bc-brand-mark" src={BRAND_IMAGES.logo} alt="" />
          <span>The Tailz Club</span>
        </div>
        <h1>Join the community</h1>
        <p className="community-muted">
          Sign in with OTP — session lasts up to 1 week.
        </p>
        {step === "email" ? (
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
              onClick={() => void sendOtp()}
            >
              {loading ? (
                <>
                  <Loader2
                    className="community-btn-spinner"
                    size={18}
                    aria-hidden
                  />
                  Sending code…
                </>
              ) : (
                "Send OTP"
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
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <button
              type="button"
              className="community-btn"
              disabled={loading || otp.replace(/\D/g, "").length < 6}
              aria-busy={loading}
              onClick={() => void verify()}
            >
              {loading ? (
                <>
                  <Loader2
                    className="community-btn-spinner"
                    size={18}
                    aria-hidden
                  />
                  Verifying…
                </>
              ) : (
                "Verify & join"
              )}
            </button>
            <button
              type="button"
              className="community-link-btn"
              style={{ marginTop: 12 }}
              disabled={loading}
              onClick={() => void sendOtp()}
            >
              Resend code
            </button>
          </>
        )}
        {error ? <p className="community-error">{error}</p> : null}
        <p className="community-footnote">
          Adoption, training, nutrition & more — open The Tailz Club mobile app.
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
  const [name, setName] = useState(initialName?.trim() ?? "");
  const [presetId, setPresetId] = useState<PresetAvatarId>("avatar-01");
  const [mode, setMode] = useState<"preset" | "upload">("preset");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
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
      setError("Enter your name (at least 2 characters).");
      return;
    }
    if (mode === "upload" && !uploadFile) {
      setError("Choose a profile photo, or pick an avatar.");
      return;
    }

    setLoading(true);
    setError("");
    let photoUri = presetAvatarUri(presetId);
    if (mode === "upload" && uploadFile) {
      const key = await uploadProfilePhotoFile(userId, uploadFile);
      if (!key) {
        setLoading(false);
        setError("Could not upload that photo. Try again or pick an avatar.");
        return;
      }
      photoUri = key;
    }

    const err = await saveWebCommunityProfile({
      userId,
      name: trimmed,
      photoUri,
    });
    setLoading(false);
    if (err) setError(err);
    else onDone();
  };

  return (
    <div
      className="community-auth-wrap"
      style={{ backgroundImage: `url(${WEB_IMAGES.communityBg})` }}
    >
      <div className="community-auth community-profile-setup">
        <div className="bc-brand" style={{ marginBottom: 16 }}>
          <img className="bc-brand-mark" src={BRAND_IMAGES.logo} alt="" />
          <span>The Tailz Club</span>
        </div>
        <h1>Set up your profile</h1>
        <p className="community-muted">
          Choose a name and avatar for the community. You can finish the rest in
          The Tailz Club app later.
        </p>

        <label
          className="community-field-label"
          htmlFor="community-profile-name"
        >
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

        <div
          className="community-avatar-tabs"
          role="tablist"
          aria-label="Avatar source"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "preset"}
            className={mode === "preset" ? "is-active" : undefined}
            disabled={loading}
            onClick={() => setMode("preset")}
          >
            Avatar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "upload"}
            className={mode === "upload" ? "is-active" : undefined}
            disabled={loading}
            onClick={() => setMode("upload")}
          >
            Photo
          </button>
        </div>

        {mode === "preset" ? (
          <div
            className="community-avatar-grid"
            role="listbox"
            aria-label="Choose an avatar"
          >
            {PRESET_AVATAR_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={presetId === id}
                className={`community-avatar-option${presetId === id ? " is-selected" : ""}`}
                disabled={loading}
                onClick={() => setPresetId(id)}
              >
                <img src={AVATAR_PRESETS[id]} alt="" />
              </button>
            ))}
          </div>
        ) : (
          <div className="community-avatar-upload">
            {uploadPreview ? (
              <img
                className="community-avatar-upload-preview"
                src={uploadPreview}
                alt=""
              />
            ) : (
              <div className="community-avatar-upload-placeholder">
                Add a photo
              </div>
            )}
            <label className="community-file-btn">
              <input
                type="file"
                accept="image/*"
                disabled={loading}
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile ? "Change photo" : "Upload photo"}
            </label>
          </div>
        )}

        <button
          type="button"
          className="community-btn"
          disabled={loading}
          aria-busy={loading}
          onClick={() => void save()}
        >
          {loading ? (
            <>
              <Loader2
                className="community-btn-spinner"
                size={18}
                aria-hidden
              />
              Saving…
            </>
          ) : (
            "Continue to community"
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

type MediaPreview = { url: string; kind: "image" | "video" };

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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (preview.kind === "video") {
      void videoRef.current?.play().catch(() => {});
    }
  }, [preview]);

  return (
    <div
      className="bc-media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={preview.kind === "video" ? "Video player" : "Image preview"}
      onClick={onClose}
    >
      <button
        type="button"
        className="bc-media-lightbox-close"
        aria-label="Close"
        onClick={onClose}
      >
        ×
      </button>
      {preview.kind === "video" ? (
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
  const displayUrl = webCommunityPostMediaUrl(post);
  if (!displayUrl) return null;
  const isVideo = isCommunityVideoMedia(post);

  if (isVideo) {
    return (
      <button
        type="button"
        className="bc-post-media video"
        onClick={() => onOpen({ url: displayUrl, kind: "video" })}
        aria-label="Play video fullscreen"
      >
        <video src={displayUrl} muted preload="metadata" playsInline />
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
      onClick={() => onOpen({ url: displayUrl, kind: "image" })}
      aria-label="Preview image"
    >
      <img src={displayUrl} alt="" />
    </button>
  );
}

type FloatHeart = {
  id: number;
  left: number;
  delay: number;
  drift: number;
  size: number;
};

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
        setHearts((prev) =>
          prev.filter((h) => !next.some((n) => n.id === h.id)),
        );
      }, 1100);
    }
    void onLike();
  };

  return (
    <div className="bc-post-actions">
      <div className="bc-like-wrap">
        <button
          type="button"
          className={`bc-action bc-like-btn ${post.likedByMe ? "liked" : ""}`}
          aria-label={post.likedByMe ? "Unlike" : "Like"}
          onClick={handleLike}
        >
          <Heart
            size={18}
            strokeWidth={2.25}
            fill={post.likedByMe ? "currentColor" : "none"}
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
                  "--float-left": `${h.left}%`,
                  "--float-delay": `${h.delay}s`,
                  "--float-drift": `${h.drift}px`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      </div>
      <button
        type="button"
        className="bc-action"
        onClick={onComment}
        aria-label="Comments"
      >
        <MessageCircle size={18} strokeWidth={2.25} />
        <span>{post.commentCount}</span>
      </button>
      <button
        type="button"
        className="bc-action"
        onClick={onShare}
        aria-label="Share"
      >
        <Share2 size={18} strokeWidth={2.25} />
        <span>Share</span>
      </button>
    </div>
  );
}

type CommentVote = "up" | "down" | null;

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
  const [sort, setSort] = useState<"popular" | "newest">("newest");
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<GlobalComment | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [votes, setVotes] = useState<
    Record<string, { up: number; down: number; mine: CommentVote }>
  >({});
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const roots = useMemo(() => {
    const top = comments.filter((c) => !c.parentId);
    if (sort === "newest") {
      return [...top].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
    [comments],
  );

  const voteOf = (id: string) =>
    votes[id] ?? { up: 0, down: 0, mine: null as CommentVote };

  const toggleVote = (id: string, next: "up" | "down") => {
    setVotes((prev) => {
      const cur = prev[id] ?? { up: 0, down: 0, mine: null as CommentVote };
      let { up, down, mine } = cur;
      if (mine === next) {
        if (next === "up") up = Math.max(0, up - 1);
        else down = Math.max(0, down - 1);
        mine = null;
      } else {
        if (mine === "up") up = Math.max(0, up - 1);
        if (mine === "down") down = Math.max(0, down - 1);
        if (next === "up") up += 1;
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
    setDraft("");
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
    const name = displayAuthorName(
      comment.authorId,
      comment.author?.name,
      userId,
    );
    const replies = repliesOf(comment.id);
    const open = expanded.has(comment.id);
    const v = voteOf(comment.id);

    return (
      <article key={comment.id} className={`bc-cmt ${isReply ? "reply" : ""}`}>
        <Avatar
          name={name}
          photoUri={comment.author?.photoUri}
          className="bc-cmt-avatar"
        />
        <div className="bc-cmt-main">
          <header className="bc-cmt-head">
            <div className="bc-cmt-meta">
              <strong>{name}</strong>
              <span>{formatCommentDate(comment.createdAt)}</span>
            </div>
            <button
              type="button"
              className="bc-cmt-more"
              aria-label="More"
              onClick={() => alert("Coming soon")}
            >
              <MoreVertical size={16} />
            </button>
          </header>
          <p className="bc-cmt-body">{comment.body}</p>
          <button
            type="button"
            className="bc-cmt-translate"
            onClick={() => alert("Translate — coming soon")}
          >
            Translate
          </button>
          <div className="bc-cmt-actions">
            <button
              type="button"
              className={v.mine === "up" ? "active" : ""}
              onClick={() => toggleVote(comment.id, "up")}
            >
              <ThumbsUp
                size={15}
                strokeWidth={2.2}
                fill={v.mine === "up" ? "currentColor" : "none"}
              />
              <span>{v.up}</span>
            </button>
            <button
              type="button"
              className={v.mine === "down" ? "active" : ""}
              onClick={() => toggleVote(comment.id, "down")}
            >
              <ThumbsDown
                size={15}
                strokeWidth={2.2}
                fill={v.mine === "down" ? "currentColor" : "none"}
              />
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
              }
            >
              {open ? "Hide" : "See"} {replies.length}{" "}
              {replies.length === 1 ? "Reply" : "Replies"}
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : null}
          {open ? replies.map((r) => renderComment(r, true)) : null}
        </div>
      </article>
    );
  };

  return (
    <div
      className="bc-comments-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Comments"
    >
      <button
        type="button"
        className="bc-comments-backdrop"
        aria-label="Close comments"
        onClick={onClose}
      />
      <div className="bc-comments-sheet">
        <header className="bc-comments-header">
          <h3>
            Comments <span>({formatCommentCount(comments.length)})</span>
          </h3>
          <div
            className="bc-comments-sort"
            role="tablist"
            aria-label="Sort comments"
          >
            <button
              type="button"
              role="tab"
              aria-selected={sort === "popular"}
              className={sort === "popular" ? "active" : ""}
              onClick={() => setSort("popular")}
            >
              <TrendingUp size={14} />
              Popular
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={sort === "newest"}
              className={sort === "newest" ? "active" : ""}
              onClick={() => setSort("newest")}
            >
              <CalendarDays size={14} />
              Newest
            </button>
          </div>
        </header>

        <div className="bc-comments-composer">
          <Avatar
            name={myName}
            photoUri={myPhotoUri}
            className="bc-cmt-avatar"
          />
          <div className="bc-comments-input-wrap">
            {replyTo ? (
              <div className="bc-comments-replying">
                Replying to{" "}
                <strong>
                  {displayAuthorName(
                    replyTo.authorId,
                    replyTo.author?.name,
                    userId,
                  )}
                </strong>
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
              onClick={() => void submit()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <div className="bc-comments-list">
          {roots.length === 0 ? (
            <p className="bc-comments-empty">
              No comments yet. Start the conversation.
            </p>
          ) : (
            roots.map((c) => renderComment(c))
          )}
        </div>
      </div>
    </div>
  );
}

const THEME_STORAGE_KEY = "tailz-community-theme";
const SIDEBAR_IMAGES = {
  day: "/sidebar/day-sidebar.png",
  night: "/sidebar/night-mode_sidebar.png",
} as const;
type CommunityTheme = "light" | "dark";

function readStoredTheme(): CommunityTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* ignore */
  }
  return "light";
}

function useCommunityTheme() {
  const [theme, setTheme] = useState<CommunityTheme>(() => readStoredTheme());

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    for (const src of Object.values(SIDEBAR_IMAGES)) {
      const img = new Image();
      img.src = src;
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
}

function PostPoll({
  post,
  userId,
  onVoted,
}: {
  post: GlobalPost;
  userId: string;
  onVoted: () => void;
}) {
  const poll = post.poll;
  const [busy, setBusy] = useState(false);
  if (!poll) return null;

  const vote = async (optionId: string) => {
    if (poll.isEnded || busy) return;
    setBusy(true);
    const err = await castGlobalPollVote({ postId: post.id, optionId, userId });
    setBusy(false);
    if (err) alert(err);
    else onVoted();
  };

  return (
    <div className="bc-post-poll">
      <div className="bc-poll-divider" aria-hidden />
      <h3 className="bc-poll-title">{poll.title}</h3>
      <ul className="bc-poll-options">
        {poll.options.map((opt) => {
          const selected = poll.myOptionId === opt.id;
          return (
            <li key={opt.id} className="bc-poll-option-row">
              <button
                type="button"
                className={`bc-poll-option${selected ? " is-selected" : ""}`}
                disabled={poll.isEnded || busy}
                aria-pressed={selected}
                onClick={() => void vote(opt.id)}
              >
                <span
                  className="bc-poll-option-fill"
                  style={{ width: `${opt.percent}%` }}
                  aria-hidden
                />
                <span className="bc-poll-option-label">{opt.label}</span>
                {selected ? (
                  <Check
                    className="bc-poll-option-check"
                    size={16}
                    strokeWidth={2.75}
                    aria-hidden
                  />
                ) : null}
              </button>
              <span className="bc-poll-option-pct">{opt.percent}%</span>
            </li>
          );
        })}
      </ul>
      <p className="bc-poll-meta">
        {formatPollVoteCount(poll.totalVotes)} ·{" "}
        {formatPollRemaining(poll.endsAt)}
      </p>
    </div>
  );
}

function PollComposeModal({
  posting,
  onClose,
  onSubmit,
}: {
  posting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    body: string;
    pollTitle: string;
    options: string[];
    durationDays: number;
  }) => void;
}) {
  const [body, setBody] = useState("");
  const [pollTitle, setPollTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [durationDays, setDurationDays] = useState(7);

  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit =
    !posting &&
    body.trim().length >= 2 &&
    pollTitle.trim().length >= 2 &&
    trimmedOptions.length >= 2;

  return (
    <div
      className="bc-compose-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Create poll"
    >
      <button
        type="button"
        className="bc-comments-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bc-compose-sheet bc-poll-compose-sheet">
        <header className="bc-compose-head">
          <h3>Create poll</h3>
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ask the community a question…"
          autoFocus
        />
        <input
          value={pollTitle}
          onChange={(e) => setPollTitle(e.target.value)}
          placeholder="Poll title (shown above options)"
        />
        <div className="bc-poll-compose-options">
          {options.map((value, index) => (
            <input
              key={index}
              value={value}
              onChange={(e) =>
                setOptions((prev) =>
                  prev.map((item, i) => (i === index ? e.target.value : item)),
                )
              }
              placeholder={`Option ${index + 1}`}
            />
          ))}
        </div>
        {options.length < 5 ? (
          <button
            type="button"
            className="community-link-btn bc-poll-add-option"
            disabled={posting}
            onClick={() => setOptions((prev) => [...prev, ""])}
          >
            + Add option
          </button>
        ) : null}
        <label className="bc-poll-duration">
          <span>Duration</span>
          <select
            value={durationDays}
            disabled={posting}
            onChange={(e) => setDurationDays(Number(e.target.value))}
          >
            <option value={1}>1 day</option>
            <option value={3}>3 days</option>
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
          </select>
        </label>
        <div className="bc-composer-actions">
          <button
            type="button"
            className="community-link-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                body: body.trim(),
                pollTitle: pollTitle.trim(),
                options: trimmedOptions,
                durationDays,
              })
            }
          >
            {posting ? "Posting…" : "Post poll"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostEvent({
  post,
  userId,
  onChanged,
  onShare,
  onSoon,
}: {
  post: GlobalPost;
  userId: string;
  onChanged: () => void;
  onShare: () => void;
  onSoon: (label: string) => void;
}) {
  const event = post.event;
  const [busy, setBusy] = useState(false);
  if (!event) return null;

  const hostName = displayAuthorName(post.authorId, post.author?.name, userId);
  const peopleCount = event.goingCount + event.interestedCount;

  const setStatus = async (status: GlobalEventRsvpStatus) => {
    if (busy) return;
    setBusy(true);
    const next = event.myStatus === status ? null : status;
    const err = await setGlobalEventRsvp({
      postId: post.id,
      userId,
      status: next,
    });
    setBusy(false);
    if (err) alert(err);
    else onChanged();
  };

  return (
    <div className="bc-post-event">
      <div className="bc-event-hero">
        <p className="bc-event-when">{formatEventStartsAt(event.startsAt)}</p>
        <h3 className="bc-event-title">{event.title}</h3>
        <p className="bc-event-place">{event.location}</p>
        <div className="bc-event-people">
          <div className="bc-event-avatars" aria-hidden>
            {event.attendees.length > 0 ? (
              event.attendees.map((person) => (
                <Avatar
                  key={person.id}
                  name={person.name}
                  photoUri={person.photoUri}
                  className="bc-event-avatar"
                />
              ))
            ) : (
              <Avatar
                name={hostName}
                photoUri={post.author?.photoUri}
                className="bc-event-avatar"
              />
            )}
          </div>
          <span>{formatEventPeopleCount(peopleCount)}</span>
        </div>
      </div>

      <ul className="bc-event-meta-list">
        <li>
          <UserRound size={16} aria-hidden />
          <span>
            Event by <strong>{hostName}</strong>
          </span>
        </li>
        <li>
          <MapPin size={16} aria-hidden />
          <span>{event.location}</span>
        </li>
        <li>
          <Globe2 size={16} aria-hidden />
          <span>
            {event.visibility === "invite_only"
              ? "Invite only"
              : "Open to everyone"}
          </span>
        </li>
      </ul>

      <p className="bc-event-desc">{post.body}</p>

      <div className="bc-event-actions">
        <button
          type="button"
          className={`bc-event-action primary${event.myStatus === "interested" ? " is-active" : ""}`}
          disabled={busy}
          onClick={() => void setStatus("interested")}
        >
          <Star
            size={15}
            strokeWidth={2.4}
            fill={event.myStatus === "interested" ? "currentColor" : "none"}
          />
          Interested
        </button>
        <button
          type="button"
          className={`bc-event-action${event.myStatus === "going" ? " is-active" : ""}`}
          disabled={busy}
          onClick={() => void setStatus("going")}
        >
          <CheckCircle2 size={15} strokeWidth={2.4} />
          Going
        </button>
        <button
          type="button"
          className="bc-event-action"
          onClick={() => onSoon("Invite")}
        >
          <Send size={15} strokeWidth={2.4} />
          Invite
        </button>
        <button type="button" className="bc-event-action" onClick={onShare}>
          <Share2 size={15} strokeWidth={2.4} />
          Share
        </button>
      </div>
    </div>
  );
}

function PostLocation({ post }: { post: GlobalPost }) {
  if (!hasTaggedLocation(post)) return null;
  const lat = post.locationLat!;
  const lng = post.locationLng!;
  const label = post.locationName?.trim() || "Shared location";
  const mapsUrl = googleMapsUrl(lat, lng, post.locationName);

  return (
    <button
      type="button"
      className="bc-post-location"
      aria-label={`Open ${label} in Google Maps`}
      onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
    >
      <div className="bc-post-location-map" aria-hidden>
        <iframe
          title=""
          src={openStreetMapEmbedUrl(lat, lng)}
          loading="lazy"
          tabIndex={-1}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="bc-post-location-meta">
        <MapPin size={16} strokeWidth={2.4} aria-hidden />
        <div>
          <strong>{label}</strong>
          <span>
            {lat.toFixed(5)}, {lng.toFixed(5)} · Open in Google Maps
          </span>
        </div>
      </div>
    </button>
  );
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      name?: string;
      display_name?: string;
      address?: { suburb?: string; city?: string; town?: string; village?: string };
    };
    return (
      data.name ||
      data.address?.suburb ||
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.display_name?.split(",").slice(0, 2).join(",").trim() ||
      null
    );
  } catch {
    return null;
  }
}

function LocationComposeModal({
  posting,
  onClose,
  onSubmit,
}: {
  posting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    body: string;
    locationName: string;
    locationLat: number;
    locationLng: number;
  }) => void;
}) {
  const [body, setBody] = useState("");
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const locateMe = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported in this browser.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        void reverseGeocode(lat, lng).then((name) => {
          if (name) setLocationName(name);
          setLocating(false);
        });
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow access and try again."
            : "Could not get your location. Try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const canSubmit = !posting && !locating && Boolean(coords);

  return (
    <div
      className="bc-compose-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Tag location"
    >
      <button
        type="button"
        className="bc-comments-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bc-compose-sheet bc-location-compose-sheet">
        <header className="bc-compose-head">
          <h3>Tag location</h3>
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <p className="community-muted" style={{ marginBottom: 12 }}>
          Share where you are. Anyone who taps the pin opens the exact spot in
          Google Maps.
        </p>
        <button
          type="button"
          className="bc-location-locate"
          disabled={posting || locating}
          onClick={locateMe}
        >
          <MapPin size={16} strokeWidth={2.4} aria-hidden />
          {locating ? "Finding you…" : coords ? "Update my location" : "Use my location"}
        </button>
        {error ? <p className="community-error">{error}</p> : null}
        {coords ? (
          <div className="bc-location-preview">
            <iframe
              title="Location preview"
              src={openStreetMapEmbedUrl(coords.lat, coords.lng)}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}
        <input
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Place name (optional)"
          disabled={posting || !coords}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note (optional)"
          rows={3}
          disabled={posting}
        />
        <div className="bc-composer-actions">
          <button type="button" className="community-link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn"
            disabled={!canSubmit}
            onClick={() => {
              if (!coords) return;
              onSubmit({
                body: body.trim() || `📍 ${locationName.trim() || "Shared a location"}`,
                locationName: locationName.trim() || "Shared location",
                locationLat: coords.lat,
                locationLng: coords.lng,
              });
            }}
          >
            {posting ? "Posting…" : "Post location"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EventComposeModal({
  posting,
  onClose,
  onSubmit,
}: {
  posting: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    body: string;
    startsAt: string;
    location: string;
    visibility: GlobalEventVisibility;
  }) => void;
}) {
  const defaultStart = useMemo(() => {
    const d = new Date(Date.now() + 86400000);
    d.setMinutes(0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
  }, []);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState<GlobalEventVisibility>("open");

  const canSubmit =
    !posting &&
    title.trim().length >= 2 &&
    body.trim().length >= 2 &&
    location.trim().length >= 2 &&
    Boolean(startsAt);

  return (
    <div
      className="bc-compose-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Create event"
    >
      <button
        type="button"
        className="bc-comments-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bc-compose-sheet bc-event-compose-sheet">
        <header className="bc-compose-head">
          <h3>Create event</h3>
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          autoFocus
        />
        <label className="bc-event-field">
          <span>Date & time</span>
          <input
            type="datetime-local"
            value={startsAt}
            disabled={posting}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (city, park, venue…)"
        />
        <label className="bc-event-field">
          <span>Who can join</span>
          <select
            value={visibility}
            disabled={posting}
            onChange={(e) =>
              setVisibility(e.target.value as GlobalEventVisibility)
            }
          >
            <option value="open">Open to everyone</option>
            <option value="invite_only">Invite only</option>
          </select>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe the event for pet parents…"
          rows={4}
        />
        <div className="bc-composer-actions">
          <button type="button" className="community-link-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                title: title.trim(),
                body: body.trim(),
                startsAt,
                location: location.trim(),
                visibility,
              })
            }
          >
            {posting ? "Posting…" : "Create event"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedComposerPanel({
  name,
  photoUri,
  posting,
  onOpenCompose,
  onOpenPoll,
  onOpenEvent,
  onOpenLocation,
  onQuickPost,
}: {
  name: string;
  photoUri: string | null;
  posting: boolean;
  onOpenCompose: () => void;
  onOpenPoll: () => void;
  onOpenEvent: () => void;
  onOpenLocation: () => void;
  onQuickPost: (body: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const canPost = draft.trim().length >= 2 && !posting;

  const submit = () => {
    if (!canPost) return;
    onQuickPost(draft.trim());
    setDraft("");
  };

  return (
    <section className="bc-feed-composer" aria-label="Create a post">
      <div className="bc-feed-composer-top">
        <Avatar
          name={name}
          photoUri={photoUri}
          className="bc-feed-composer-avatar"
        />
        <input
          className="bc-feed-composer-input"
          type="text"
          value={draft}
          disabled={posting}
          placeholder="Share a happy moment, ask a question, or help a fellow pet parent..."
          aria-label="Write a post"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canPost) {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>
      <div className="bc-feed-composer-actions">
        <button
          type="button"
          className="bc-compose-chip"
          disabled={posting}
          onClick={onOpenCompose}
        >
          <ImageIcon size={15} strokeWidth={2.25} aria-hidden />
          Photo/Video
        </button>
        <button
          type="button"
          className="bc-compose-chip"
          disabled={posting}
          onClick={onOpenPoll}
        >
          <BarChart2 size={15} strokeWidth={2.25} aria-hidden />
          Poll
        </button>
        <button
          type="button"
          className="bc-compose-chip"
          disabled={posting}
          onClick={onOpenEvent}
        >
          <CalendarDays size={15} strokeWidth={2.25} aria-hidden />
          Event
        </button>
        <button
          type="button"
          className="bc-compose-chip"
          disabled={posting}
          onClick={onOpenLocation}
        >
          <MapPin size={15} strokeWidth={2.25} aria-hidden />
          Tag Location
        </button>
        <button
          type="button"
          className="bc-feed-composer-post"
          disabled={!canPost}
          onClick={submit}
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </section>
  );
}

function ThemeSwitch({
  isDark,
  onToggle,
  className,
}: {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      className={`bc-theme-switch${isDark ? " is-night" : " is-day"}${className ? ` ${className}` : ""}`}
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="bc-theme-switch-knob" aria-hidden>
        <span className="bc-theme-icon">
          <Moon
            className="bc-theme-phase bc-theme-moon"
            size={15}
            strokeWidth={2.5}
          />
          <Sun
            className="bc-theme-phase bc-theme-sun"
            size={15}
            strokeWidth={2.5}
          />
        </span>
      </span>
    </button>
  );
}

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

type ComposerDraft = {
  body: string;
  petName: string;
  file: File | null;
  previewUrl: string | null;
  kind: "image" | "video" | null;
  clearMedia: boolean;
};

function emptyDraft(post?: GlobalPost | null): ComposerDraft {
  return {
    body: post?.body ?? "",
    petName: post?.petName ?? "",
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
  mode: "create" | "edit";
  initial: GlobalPost | null;
  posting: boolean;
  onClose: () => void;
  onSubmit: (draft: ComposerDraft) => void;
}) {
  const [draft, setDraft] = useState<ComposerDraft>(() => emptyDraft(initial));
  const photoRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(emptyDraft(initial));
  }, [initial]);

  const attach = (file: File | undefined, kind: "image" | "video") => {
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      alert("That file is larger than 50 MB.");
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

  const existingUrl =
    !draft.clearMedia && !draft.file ? initial?.mediaUrl : null;
  const existingKind =
    initial && isCommunityVideoMedia(initial) ? "video" : "image";
  const canSubmit =
    !posting &&
    (draft.body.trim().length >= 2 ||
      Boolean(draft.file) ||
      Boolean(existingUrl));

  return (
    <div
      className="bc-compose-modal"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "edit" ? "Edit post" : "New post"}
    >
      <button
        type="button"
        className="bc-comments-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bc-compose-sheet">
        <header className="bc-compose-head">
          <h3>{mode === "edit" ? "Edit post" : "New post"}</h3>
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <textarea
          value={draft.body}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, body: e.target.value }))
          }
          placeholder="Share a moment, ask a question, or post a tip..."
          autoFocus
        />
        <input
          value={draft.petName}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, petName: e.target.value }))
          }
          placeholder="Pet name (optional)"
        />
        {draft.previewUrl && draft.kind ? (
          <div className="bc-compose-preview">
            {draft.kind === "video" ? (
              <video src={draft.previewUrl} muted controls />
            ) : (
              <img src={draft.previewUrl} alt="" />
            )}
            <button
              type="button"
              className="bc-compose-remove"
              aria-label="Remove media"
              onClick={() => {
                setDraft((prev) => {
                  if (prev.previewUrl) URL.revokeObjectURL(prev.previewUrl);
                  return { ...prev, file: null, previewUrl: null, kind: null };
                });
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : existingUrl ? (
          <div className="bc-compose-preview">
            {existingKind === "video" ? (
              <video src={existingUrl} muted />
            ) : (
              <img src={existingUrl} alt="" />
            )}
            <button
              type="button"
              className="bc-compose-remove"
              aria-label="Remove media"
              onClick={() =>
                setDraft((prev) => ({ ...prev, clearMedia: true }))
              }
            >
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
              attach(e.target.files?.[0], "image");
              e.target.value = "";
            }}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            hidden
            onChange={(e) => {
              attach(e.target.files?.[0], "video");
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="bc-chip"
            onClick={() => photoRef.current?.click()}
          >
            <ImageIcon size={14} /> Photo
          </button>
          <button
            type="button"
            className="bc-chip"
            onClick={() => videoRef.current?.click()}
          >
            <Film size={14} /> Video
          </button>
          <button
            type="button"
            className="community-link-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn"
            disabled={!canSubmit}
            onClick={() => onSubmit(draft)}
          >
            {posting ? "Saving…" : mode === "edit" ? "Save" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeletePostModal({
  deleting,
  onClose,
  onConfirm,
}: {
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="bc-compose-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bc-delete-title"
      aria-describedby="bc-delete-desc"
    >
      <button
        type="button"
        className="bc-comments-backdrop"
        aria-label="Close"
        disabled={deleting}
        onClick={onClose}
      />
      <div className="bc-compose-sheet bc-delete-sheet">
        <header className="bc-compose-head">
          <h3 id="bc-delete-title">Delete post?</h3>
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="Close"
            disabled={deleting}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <p id="bc-delete-desc" className="community-muted bc-delete-copy">
          Are you sure you want to delete this post? This removes it for everyone
          and can’t be undone.
        </p>
        <div className="bc-composer-actions bc-delete-actions">
          <button
            type="button"
            className="community-link-btn"
            disabled={deleting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn bc-delete-confirm"
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? "Deleting…" : "Delete post"}
          </button>
        </div>
      </div>
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
  const [details, setDetails] = useState("");

  return (
    <div
      className="bc-compose-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Report post"
    >
      <button
        type="button"
        className="bc-comments-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="bc-compose-sheet">
        <header className="bc-compose-head">
          <h3>Report post</h3>
          <button
            type="button"
            className="bc-icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <p className="community-muted">Why are you reporting this post?</p>
        <div className="bc-reason-list">
          {POST_REPORT_REASONS.map((item) => (
            <button
              key={item}
              type="button"
              className={`bc-chip ${reason === item ? "active" : ""}`}
              onClick={() => setReason(item)}
            >
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
          <button
            type="button"
            className="community-link-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bc-post-btn"
            disabled={posting}
            onClick={() => onSubmit(reason, details)}
          >
            {posting ? "Sending…" : "Submit report"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommunityPage() {
  const { theme, toggleTheme } = useCommunityTheme();
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [posts, setPosts] = useState<GlobalPost[]>([]);
  const [members, setMembers] = useState(0);
  const [posting, setPosting] = useState(false);
  const [composer, setComposer] = useState<null | {
    mode: "create" | "edit";
    post: GlobalPost | null;
  }>(null);
  const [reportPost, setReportPost] = useState<GlobalPost | null>(null);
  const [deletePost, setDeletePost] = useState<GlobalPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [menuPostId, setMenuPostId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [nav, setNav] = useState<"foryou" | "following" | "packs">("foryou");
  const [recentCleared, setRecentCleared] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<GlobalComment[]>([]);
  const [myProfile, setMyProfile] = useState<{
    name: string;
    photoUri: string | null;
  }>({
    name: "You",
    photoUri: null,
  });
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null);
  const [pollComposerOpen, setPollComposerOpen] = useState(false);
  const [eventComposerOpen, setEventComposerOpen] = useState(false);
  const [locationComposerOpen, setLocationComposerOpen] = useState(false);

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
      setMyProfile({ name: "You", photoUri: null });
      return;
    }
    setProfileChecked(false);
    void fetchProfilePreview(userId).then((p) => {
      if (p) {
        setMyProfile({ name: p.name, photoUri: p.photoUri });
        setProfileReady(p.ready);
      } else {
        setMyProfile({ name: "You", photoUri: null });
        setProfileReady(false);
      }
      setProfileChecked(true);
    });
  }, [userId]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const name = displayAuthorName(
        p.authorId,
        p.author?.name,
        userId,
      ).toLowerCase();
      return (
        p.body.toLowerCase().includes(q) ||
        name.includes(q) ||
        (p.petName ?? "").toLowerCase().includes(q)
      );
    });
  }, [posts, search, userId]);

  const feedRows = useMemo(() => buildFeedRows(filteredPosts), [filteredPosts]);
  const recentPosts = useMemo(
    () => (recentCleared ? [] : posts.slice(0, 6)),
    [posts, recentCleared],
  );
  const livePolls = useMemo(
    () => posts.filter(isLiveCommunityPoll).slice(0, 4),
    [posts],
  );
  const liveEvents = useMemo(
    () =>
      posts
        .filter(isLiveCommunityEvent)
        .sort(
          (a, b) =>
            new Date(a.event?.startsAt ?? 0).getTime() -
            new Date(b.event?.startsAt ?? 0).getTime(),
        )
        .slice(0, 4),
    [posts],
  );

  const reload = useCallback(async () => {
    const [nextPosts, count] = await Promise.all([
      fetchGlobalPosts(userId),
      fetchMemberCount(),
    ]);
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
    setComposer({ mode: "create", post: null });
    setNav("foryou");
  };

  const submitPoll = async (input: {
    body: string;
    pollTitle: string;
    options: string[];
    durationDays: number;
  }) => {
    if (!userId || posting) return;
    setPosting(true);
    const err = await createGlobalPollPost({
      authorId: userId,
      body: input.body,
      pollTitle: input.pollTitle,
      options: input.options,
      durationDays: input.durationDays,
    });
    setPosting(false);
    if (err) {
      alert(err);
      return;
    }
    setPollComposerOpen(false);
    setRecentCleared(false);
    void reload();
  };

  const submitEvent = async (input: {
    title: string;
    body: string;
    startsAt: string;
    location: string;
    visibility: GlobalEventVisibility;
  }) => {
    if (!userId || posting) return;
    setPosting(true);
    const err = await createGlobalEventPost({
      authorId: userId,
      title: input.title,
      body: input.body,
      startsAt: input.startsAt,
      location: input.location,
      visibility: input.visibility,
    });
    setPosting(false);
    if (err) {
      alert(err);
      return;
    }
    setEventComposerOpen(false);
    setRecentCleared(false);
    void reload();
  };

  const submitLocation = async (input: {
    body: string;
    locationName: string;
    locationLat: number;
    locationLng: number;
  }) => {
    if (!userId || posting) return;
    setPosting(true);
    const err = await createGlobalPost({
      authorId: userId,
      body: input.body,
      postType: "text",
      locationName: input.locationName,
      locationLat: input.locationLat,
      locationLng: input.locationLng,
    });
    setPosting(false);
    if (err) {
      alert(err);
      return;
    }
    setLocationComposerOpen(false);
    setRecentCleared(false);
    void reload();
  };

  const quickPost = async (body: string) => {
    const trimmed = body.trim();
    if (!userId || trimmed.length < 2 || posting) return;
    setPosting(true);
    const err = await createGlobalPost({
      authorId: userId,
      body: trimmed,
      postType: trimmed.includes("?") ? "question" : "text",
    });
    setPosting(false);
    if (err) {
      alert(err);
      return;
    }
    setRecentCleared(false);
    void reload();
  };

  useEffect(() => {
    if (!menuPostId) return;
    const close = () => setMenuPostId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuPostId]);

  const soon = (label: string) => alert(`${label} — coming soon.`);

  if (!ready) return <div className="bc-loading">Loading community…</div>;
  if (!userId) {
    return (
      <AuthPanel
        onAuthed={() =>
          supabase.auth
            .getSession()
            .then(({ data }) => setUserId(data.session?.user?.id ?? null))
        }
      />
    );
  }
  if (!profileChecked)
    return <div className="bc-loading">Loading community…</div>;
  if (!profileReady) {
    return (
      <ProfileSetupPanel
        userId={userId}
        initialName={myProfile.name !== "You" ? myProfile.name : ""}
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
    const keptMedia =
      composer.mode === "edit" &&
      composer.post?.mediaStorageKey &&
      !draft.clearMedia;
    const body =
      draft.body.trim() ||
      (draft.file || keptMedia ? "Shared a moment 🐾" : "");
    if (body.length < 2) {
      alert("Write a caption or attach a photo or video.");
      return;
    }

    setPosting(true);
    let mediaKey: string | null | undefined;
    let postType: GlobalPostType | undefined;
    if (draft.file) {
      const uploaded = await uploadCommunityFile(userId, draft.file);
      if (!uploaded) {
        setPosting(false);
        alert("Could not upload that file.");
        return;
      }
      mediaKey = uploaded.key;
      postType = uploaded.kind === "video" ? "video" : "photo";
    } else if (draft.clearMedia) {
      mediaKey = null;
      postType = body.includes("?") ? "question" : "text";
    } else if (composer.mode === "create") {
      postType = body.includes("?") ? "question" : "text";
    }

    const err =
      composer.mode === "edit" && composer.post
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

  const confirmDeletePost = async () => {
    if (!deletePost || deleting) return;
    setDeleting(true);
    const err = await deleteGlobalPost(deletePost.id);
    setDeleting(false);
    if (err) {
      alert(err);
      return;
    }
    setDeletePost(null);
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
    alert("Report sent. Our team will review this post.");
  };

  const myLabel = "You";

  return (
    <div
      className="community-shell"
      data-theme={theme}
      style={{ backgroundImage: `url(${WEB_IMAGES.communityBg})` }}
    >
      <header className="bc-topnav">
        <Link to="/community" className="bc-brand">
          <img className="bc-brand-mark" src={BRAND_IMAGES.logo} alt="" />
          <span>The Tailz Club</span>
        </Link>

        <label className="bc-search">
          <span aria-hidden>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search The Tailz Club"
            aria-label="Search The Tailz Club"
          />
        </label>

        <div className="bc-top-actions">
          <button type="button" className="bc-create-btn" onClick={openCreate}>
            + <span>Create</span>
          </button>
          <ThemeSwitch
            isDark={theme === "dark"}
            onToggle={toggleTheme}
            className="bc-theme-switch-top"
          />
          <button
            type="button"
            className="bc-icon-btn"
            title="Messages"
            onClick={() => soon("Messages")}
          >
            💬
          </button>
          <button
            type="button"
            className="bc-icon-btn"
            title="Notifications"
            onClick={() => soon("Notifications")}
          >
            🔔
          </button>
          <button
            type="button"
            className="bc-avatar-btn"
            title="Sign out"
            onClick={() => void supabase.auth.signOut()}
          >
            {initials(myLabel)}
          </button>
        </div>
      </header>

      <div className="bc-body">
        <aside className="bc-left">
          <div className="bc-left-bg" aria-hidden>
            <div
              className="bc-left-bg-layer bc-left-bg-day"
              style={{ backgroundImage: `url(${SIDEBAR_IMAGES.day})` }}
            />
            <div
              className="bc-left-bg-layer bc-left-bg-night"
              style={{ backgroundImage: `url(${SIDEBAR_IMAGES.night})` }}
            />
            <div className="bc-left-bg-scrim" />
          </div>
          <div className="bc-left-inner">
            <nav className="bc-nav-section" aria-label="Primary">
              <button
                type="button"
                className={`bc-nav-item ${nav === "foryou" ? "active" : ""}`}
                onClick={() => setNav("foryou")}
              >
                <span className="bc-nav-ico">⌂</span> For You
              </button>
              <button
                type="button"
                className="bc-nav-item soon"
                onClick={() => {
                  setNav("following");
                  soon("Following");
                }}
              >
                <span className="bc-nav-ico">☆</span> Following
                <span className="bc-nav-meta">Soon</span>
              </button>
              <button
                type="button"
                className="bc-nav-item soon"
                onClick={() => soon("Popular")}
              >
                <span className="bc-nav-ico">↗</span> Popular
                <span className="bc-nav-meta">Soon</span>
              </button>
            </nav>

            <div className="bc-nav-section">
              <h3>Discover</h3>
              <button
                type="button"
                className={`bc-nav-item soon ${nav === "packs" ? "active" : ""}`}
                onClick={() => {
                  setNav("packs");
                  soon("Packs");
                }}
              >
                <span className="bc-nav-ico">◎</span> Packs
                <span className="bc-nav-meta">Soon</span>
              </button>
              <button
                type="button"
                className="bc-nav-item soon"
                onClick={() => soon("Meetups")}
              >
                <span className="bc-nav-ico">📍</span> Meetups
                <span className="bc-nav-meta">Soon</span>
              </button>
              <button
                type="button"
                className="bc-nav-item soon"
                onClick={() => soon("Adoption stories")}
              >
                <span className="bc-nav-ico">🐾</span> Adoption
                <span className="bc-nav-meta">Soon</span>
              </button>
            </div>

            <div className="bc-member-card">
              <strong>The Tailz Club Community</strong>
              <span>
                {formatMemberCount(members || 1)} pet parents · global feed
              </span>
            </div>

            <div className="bc-theme-toggle">
              <ThemeSwitch isDark={theme === "dark"} onToggle={toggleTheme} />
            </div>
          </div>
        </aside>

        <main className="bc-main">
          <FeedComposerPanel
            name={myProfile.name}
            photoUri={myProfile.photoUri}
            posting={posting}
            onOpenCompose={openCreate}
            onOpenPoll={() => setPollComposerOpen(true)}
            onOpenEvent={() => setEventComposerOpen(true)}
            onOpenLocation={() => setLocationComposerOpen(true)}
            onQuickPost={(body) => void quickPost(body)}
          />
          <div className="bc-feed">
            {feedRows.length === 0 ? (
              <div className="bc-empty">
                {search.trim()
                  ? "No posts match your search."
                  : "No posts yet. Share something above to get started."}
              </div>
            ) : (
              feedRows.map((row) => {
                if (row.kind === "date") {
                  return (
                    <div key={row.key} className="community-date-row">
                      <span className="community-date-line" />
                      <span className="community-date-label">{row.label}</span>
                      <span className="community-date-line" />
                    </div>
                  );
                }

                const { post } = row;
                const authorLabel = displayAuthorName(
                  post.authorId,
                  post.author?.name,
                  userId,
                );
                const snippet = postSnippet(post);
                const isOwn = post.authorId === userId;

                return (
                  <article
                    key={post.id}
                    id={`post-${post.id}`}
                    className="bc-post"
                  >
                    <div className="bc-post-top">
                      <Avatar
                        name={authorLabel}
                        photoUri={post.author?.photoUri}
                        className="bc-post-avatar"
                      />
                      <div className="bc-post-meta">
                        <strong>{authorLabel}</strong>
                        {post.petName ? (
                          <span className="bc-time">· {post.petName}</span>
                        ) : null}
                        <span className="bc-time">
                          · {timeAgo(post.createdAt)}
                        </span>
                      </div>
                      {!isOwn ? (
                        <button
                          type="button"
                          className="bc-follow-btn"
                          onClick={() => soon("Follow")}
                        >
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
                            setMenuPostId((current) =>
                              current === post.id ? null : post.id,
                            );
                          }}
                        >
                          ⋯
                        </button>
                        {menuPostId === post.id ? (
                          <div
                            className="bc-menu"
                            role="menu"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isOwn ? (
                              <>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => {
                                    setMenuPostId(null);
                                    setComposer({ mode: "edit", post });
                                  }}
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="danger"
                                  onClick={() => {
                                    setMenuPostId(null);
                                    setDeletePost(post);
                                  }}
                                >
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
                                }}
                              >
                                <Flag size={14} /> Report
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="bc-post-body">
                      {post.postType === "event" ? (
                        <PostEvent
                          post={post}
                          userId={userId}
                          onChanged={() => void reload()}
                          onSoon={soon}
                          onShare={() =>
                            void navigator.share?.({
                              text: `${post.event?.title ?? "Event"}: ${post.body}`,
                            })
                          }
                        />
                      ) : (
                        <>
                          <div>
                            <h2 className="bc-post-title">{postTitle(post)}</h2>
                            {snippet ? (
                              <p className="bc-post-text">{snippet}</p>
                            ) : null}
                          </div>
                          {post.postType === "poll" ? (
                            <PostPoll
                              post={post}
                              userId={userId}
                              onVoted={() => void reload()}
                            />
                          ) : null}
                          <PostMedia post={post} onOpen={setMediaPreview} />
                          <PostLocation post={post} />
                        </>
                      )}
                    </div>

                    {post.postType !== "event" ? (
                      <PostReactions
                        post={post}
                        onLike={() =>
                          togglePostLike(
                            post.id,
                            userId,
                            Boolean(post.likedByMe),
                          ).then(reload)
                        }
                        onComment={() => {
                          setCommentPostId(post.id);
                          setComments([]);
                          void fetchComments(post.id).then(setComments);
                        }}
                        onShare={() =>
                          void navigator.share?.({
                            text: `${authorLabel}: ${post.body}`,
                          })
                        }
                      />
                    ) : null}
                  </article>
                );
              })
            )}
          </div>
        </main>

        <aside className="bc-right">
          <div className="bc-panel">
            <div className="bc-panel-head">
              <h2>Live polls</h2>
            </div>
            {livePolls.length === 0 ? (
              <p className="community-muted">No live polls right now.</p>
            ) : (
              livePolls.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="bc-live-item"
                  onClick={() => {
                    document
                      .getElementById(`post-${post.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <span className="bc-live-badge poll">Poll</span>
                  <strong>{post.poll?.title ?? "Poll"}</strong>
                  <span>
                    {formatPollVoteCount(post.poll?.totalVotes ?? 0)} ·{" "}
                    {formatPollRemaining(post.poll?.endsAt ?? post.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="bc-panel" style={{ marginTop: 12 }}>
            <div className="bc-panel-head">
              <h2>Live events</h2>
            </div>
            {liveEvents.length === 0 ? (
              <p className="community-muted">No upcoming events yet.</p>
            ) : (
              liveEvents.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="bc-live-item"
                  onClick={() => {
                    document
                      .getElementById(`post-${post.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <span className="bc-live-badge event">Event</span>
                  <strong>{post.event?.title ?? "Event"}</strong>
                  <span>
                    {post.event ? formatEventStartsAt(post.event.startsAt) : ""}
                  </span>
                  <span className="bc-live-loc">{post.event?.location}</span>
                </button>
              ))
            )}
          </div>

          <div className="bc-panel" style={{ marginTop: 12 }}>
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
                const authorLabel = displayAuthorName(
                  post.authorId,
                  post.author?.name,
                  userId,
                );
                const thumbUrl = webCommunityPostMediaUrl(post);
                return (
                  <button
                    key={post.id}
                    type="button"
                    className="bc-recent-item"
                    onClick={() => {
                      document
                        .getElementById(`post-${post.id}`)
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                  >
                    <div>
                      <div className="bc-recent-meta">
                        {authorLabel} · {timeAgo(post.createdAt)}
                      </div>
                      <p className="bc-recent-title">
                        {post.postType === "event"
                          ? (post.event?.title ?? postTitle(post))
                          : post.postType === "poll"
                            ? (post.poll?.title ?? postTitle(post))
                            : postTitle(post)}
                      </p>
                      {postSnippet(post) && post.postType !== "event" ? (
                        <p className="bc-recent-snippet">{postSnippet(post)}</p>
                      ) : null}
                    </div>
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" className="bc-recent-thumb" />
                    ) : (
                      <span className="bc-recent-thumb placeholder">🐾</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {pollComposerOpen ? (
        <PollComposeModal
          posting={posting}
          onClose={() => {
            if (!posting) setPollComposerOpen(false);
          }}
          onSubmit={(input) => void submitPoll(input)}
        />
      ) : null}

      {eventComposerOpen ? (
        <EventComposeModal
          posting={posting}
          onClose={() => {
            if (!posting) setEventComposerOpen(false);
          }}
          onSubmit={(input) => void submitEvent(input)}
        />
      ) : null}

      {locationComposerOpen ? (
        <LocationComposeModal
          posting={posting}
          onClose={() => {
            if (!posting) setLocationComposerOpen(false);
          }}
          onSubmit={(input) => void submitLocation(input)}
        />
      ) : null}

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

      {deletePost ? (
        <DeletePostModal
          deleting={deleting}
          onClose={() => {
            if (!deleting) setDeletePost(null);
          }}
          onConfirm={() => void confirmDeletePost()}
        />
      ) : null}

      {mediaPreview ? (
        <MediaLightbox
          preview={mediaPreview}
          onClose={() => setMediaPreview(null)}
        />
      ) : null}

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
