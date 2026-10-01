import { PLAY_STORE_URL } from '../config';

type StoreBadgesProps = {
  layout?: 'row' | 'column';
  className?: string;
};

export function StoreBadges({ layout = 'row', className = '' }: StoreBadgesProps) {
  return (
    <div className={`store-badges store-badges--${layout} ${className}`.trim()}>
      <a
        className="store-badge store-badge--play"
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get Basera on Google Play"
      >
        <span className="store-badge__icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              fill="currentColor"
              d="M3.6 1.8c-.3.2-.5.6-.5 1v18.4c0 .4.2.8.5 1l.1.1 10.3-10.3v-.4L3.7 1.7l-.1.1zm12.8 8.5-2.8-2.8 2.8-2.8 3.9 2.2c.7.4.7 1.4 0 1.8l-3.9 2.2v-.6zM14.4 12l-2.8 2.8 8.9 5.1c.5.3 1.1-.1 1.1-.7V5.8c0-.6-.6-1-1.1-.7L11.6 12h2.8zM6.4 3.3 14.4 12 6.4 20.7 2.1 16.4c-.5-.5-.5-1.3 0-1.8L6.4 3.3z"
            />
          </svg>
        </span>
        <span className="store-badge__text">
          <span className="store-badge__label">Get it on</span>
          <span className="store-badge__name">Google Play</span>
        </span>
      </a>

      <div className="store-badge store-badge--apple store-badge--soon" aria-label="App Store — coming soon">
        <span className="store-badge__soon">Coming soon</span>
        <span className="store-badge__icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path
              fill="currentColor"
              d="M16.5 12.9c-.1-2.1 1.7-3.1 1.8-3.2-1-.1-2-.6-2.6-1.4-.6-.8-1-1.9-.9-3 1-.1 2.1.6 2.6.6.5 0 2.2-.8 3.6-.7 1.5.1 2.6.9 3.3 2.2-2.9 1.7-2.4 6.2.4 7.6-.4 1.2-1 2.4-1.7 3.5-.8 1.2-1.7 2.4-2.9 2.4-1.1 0-1.5-.7-2.8-.7-1.3 0-1.7.7-2.9.7-1.2 0-2.1-1.1-2.9-2.3-1.5-2.2-2.7-6.2-1.1-8.9.8-1.4 2.2-2.3 3.8-2.3 1.4.1 2.5.9 3.2.9.7 0 2.1-1.1 3.6-1zm-2.2-6.4c.7-.9 1.2-2.1 1.1-3.3-1.1.1-2.4.7-3.1 1.6-.7.8-1.2 2-1 3.2 1.2.1 2.4-.6 3-1.5z"
            />
          </svg>
        </span>
        <span className="store-badge__text">
          <span className="store-badge__label">Download on the</span>
          <span className="store-badge__name">App Store</span>
        </span>
      </div>
    </div>
  );
}
