import playstoreImg from '../../../mobile/assets/images/web/playstore.png';

import { PLAY_STORE_URL } from '../config';

export function HeroSection() {
  return (
    <section className="hero" aria-label="Basera">
      <picture className="hero__banner-wrap">
        <source
          media="(max-width: 1023px)"
          srcSet="/landing%20page/hero_mobile_full.png"
        />
        <img
          className="hero__banner"
          src="/landing%20page/hero_full_bg.png"
          alt="Basera — pet community app"
          fetchPriority="high"
        />
      </picture>
      <a
        className="hero__playstore"
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src={playstoreImg}
          alt="Get it on Google Play"
          width={340}
          height={100}
        />
      </a>
    </section>
  );
}
