import { Camera, ExternalLink, PawPrint, Play, Rss, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  ACTIVITY_HIGHLIGHTS,
  INSTAGRAM_HANDLE,
  INSTAGRAM_POST_URLS,
  INSTAGRAM_PROFILE_URL,
  YOUTUBE_CHANNEL_URL,
  YOUTUBE_VIDEO_IDS,
  type ActivityHighlight,
} from '../activity/activityFeed';
import { SiteHeader } from '../components/SiteHeader';
import { CONTACT_EMAIL } from '../config';
import '../landing/landing.css';
import './activity.css';

type FeedFilter = 'all' | 'instagram' | 'youtube' | 'updates';

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

function useInstagramEmbedScript(postUrls: string[]) {
  useEffect(() => {
    if (postUrls.length === 0) return;

    const process = () => window.instgrm?.Embeds.process();

    if (window.instgrm) {
      process();
      return;
    }

    const existing = document.querySelector('script[data-instagram-embed]');
    if (existing) {
      existing.addEventListener('load', process);
      return () => existing.removeEventListener('load', process);
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.dataset.instagramEmbed = 'true';
    script.onload = process;
    document.body.appendChild(script);
  }, [postUrls]);
}

function InstagramPost({ url }: { url: string }) {
  return (
    <blockquote
      className="instagram-media activity-embed activity-embed--instagram"
      data-instgrm-captioned
      data-instgrm-permalink={url}
      data-instgrm-version="14"
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        View on Instagram
      </a>
    </blockquote>
  );
}

function YouTubeVideo({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="activity-embed activity-embed--youtube">
      <iframe
        title={title}
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

function HighlightCard({ post }: { post: ActivityHighlight }) {
  const isInternal = post.href.startsWith('/');
  const body = (
    <>
      <p className="activity-card__meta">
        <span>{post.source}</span>
        {post.dateLabel ? <span>{post.dateLabel}</span> : null}
      </p>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <span className="activity-card__link">
        Read more
        <ExternalLink size={16} aria-hidden />
      </span>
    </>
  );

  if (isInternal) {
    return (
      <Link className="activity-card activity-card--highlight" to={post.href}>
        {body}
      </Link>
    );
  }

  return (
    <a
      className="activity-card activity-card--highlight"
      href={post.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {body}
    </a>
  );
}

const FILTER_OPTIONS: { id: FeedFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'updates', label: 'Updates' },
];

export function ActivityPage() {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const year = new Date().getFullYear();

  useInstagramEmbedScript(INSTAGRAM_POST_URLS);

  const showInstagram = filter === 'all' || filter === 'instagram';
  const showYoutube = filter === 'all' || filter === 'youtube';
  const showUpdates = filter === 'all' || filter === 'updates';

  const hasInstagramEmbeds = INSTAGRAM_POST_URLS.length > 0;
  const hasYoutubeEmbeds = YOUTUBE_VIDEO_IDS.length > 0;

  return (
    <div className="lp activity-page">
      <SiteHeader />

      <main className="activity-main">
        <section className="activity-hero" aria-labelledby="activity-title">
          <div className="lp-wrap">
            <p className="lp-kicker">
              <Rss size={14} aria-hidden />
              Activity
            </p>
            <h1 id="activity-title">Stories from the pack</h1>
            <p className="lp-lead activity-hero__lead">
              Clips from Instagram and YouTube, plus product and community updates from The Tailz
              Club — all in one place.
            </p>
            <div className="activity-channels">
              <a
                className="activity-channel"
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Camera size={18} aria-hidden />
                @{INSTAGRAM_HANDLE}
              </a>
              <a
                className="activity-channel"
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Video size={18} aria-hidden />
                YouTube channel
              </a>
            </div>
          </div>
        </section>

        <section className="activity-feed" aria-label="Activity feed">
          <div className="lp-wrap">
            <div className="activity-toolbar" role="tablist" aria-label="Filter activity">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === option.id}
                  className={`activity-filter${filter === option.id ? ' is-active' : ''}`}
                  onClick={() => setFilter(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {showYoutube ? (
              <div className="activity-section">
                <div className="activity-section__head">
                  <h2>
                    <Video size={22} aria-hidden />
                    YouTube
                  </h2>
                  <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                    View channel
                    <ExternalLink size={16} aria-hidden />
                  </a>
                </div>
                {hasYoutubeEmbeds ? (
                  <div className="activity-grid activity-grid--video">
                    {YOUTUBE_VIDEO_IDS.map((id) => (
                      <YouTubeVideo key={id} videoId={id} title={`YouTube video ${id}`} />
                    ))}
                  </div>
                ) : (
                  <a
                    className="activity-channel-card"
                    href={YOUTUBE_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="activity-channel-card__icon" aria-hidden>
                      <Play size={28} />
                    </span>
                    <div>
                      <h3>Watch on YouTube</h3>
                      <p>Subscribe for adoption tips, community meetups, and care guides.</p>
                    </div>
                  </a>
                )}
              </div>
            ) : null}

            {showInstagram ? (
              <div className="activity-section">
                <div className="activity-section__head">
                  <h2>
                    <Camera size={22} aria-hidden />
                    Instagram
                  </h2>
                  <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer">
                    View profile
                    <ExternalLink size={16} aria-hidden />
                  </a>
                </div>
                {hasInstagramEmbeds ? (
                  <div className="activity-grid activity-grid--instagram">
                    {INSTAGRAM_POST_URLS.map((url) => (
                      <InstagramPost key={url} url={url} />
                    ))}
                  </div>
                ) : (
                  <a
                    className="activity-channel-card"
                    href={INSTAGRAM_PROFILE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="activity-channel-card__icon" aria-hidden>
                      <Camera size={28} />
                    </span>
                    <div>
                      <h3>Follow on Instagram</h3>
                      <p>Reels and posts from feeders, adopters, and neighbourhood packs.</p>
                    </div>
                  </a>
                )}
              </div>
            ) : null}

            {showUpdates ? (
              <div className="activity-section">
                <div className="activity-section__head">
                  <h2>
                    <Rss size={22} aria-hidden />
                    Updates
                  </h2>
                </div>
                <div className="activity-grid activity-grid--cards">
                  {ACTIVITY_HIGHLIGHTS.map((post) => (
                    <HighlightCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer__grid">
          <div>
            <Link className="lp-brand" to="/">
              <span className="lp-brand__mark" aria-hidden>
                <PawPrint size={18} strokeWidth={2.4} />
              </span>
              The Tailz Club
            </Link>
            <p>Adoption, care, and community — for pets and the people who love them.</p>
          </div>
          <div>
            <p className="lp-footer__label">Explore</p>
            <a href="/#adopt">Adopt</a>
            <Link to="/activity">Activity</Link>
            <Link to="/community">Community</Link>
            <Link to="/tag">Collar tags</Link>
          </div>
          <div>
            <p className="lp-footer__label">Say hello</p>
            {CONTACT_EMAIL ? (
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            ) : null}
          </div>
        </div>
        <div className="lp-wrap lp-footer__bar">
          <p>© {year} The Tailz Club · Made for pet parents in India</p>
        </div>
      </footer>
    </div>
  );
}
