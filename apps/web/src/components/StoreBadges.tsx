type StoreBadgesProps = {
  layout?: 'row' | 'column';
  className?: string;
};

export function StoreBadges({ layout = 'row', className = '' }: StoreBadgesProps) {
  return (
    <div className={`store-badges store-badges--${layout} ${className}`.trim()}>
      <div className="store-badge store-badge--play store-badge--soon" aria-label="Google Play — coming soon">
        <span className="store-badge__soon">Coming soon</span>
        <img
          className="store-badge__logo"
          src="/landing-page/playstore.png"
          alt=""
          width={32}
          height={32}
        />
        <span className="store-badge__text">
          <span className="store-badge__label">Get it on</span>
          <span className="store-badge__name">Google Play</span>
        </span>
      </div>

      <div className="store-badge store-badge--apple" aria-label="Download on the App Store">
        <img
          className="store-badge__logo"
          src="/landing-page/appstore.png"
          alt=""
          width={32}
          height={32}
        />
        <span className="store-badge__text">
          <span className="store-badge__label">Download on the</span>
          <span className="store-badge__name">App Store</span>
        </span>
      </div>
    </div>
  );
}
