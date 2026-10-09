export function HeroSection() {
  return (
    <section className="hero" aria-label="Basera">
      <picture className="hero__banner-wrap">
        <source
          media="(max-width: 1023px)"
          srcSet="/landing-page/hero_mobile_full.png"
        />
        <img
          className="hero__banner"
          src="/landing-page/hero_full_bg.png"
          alt="Basera — pet community app"
          fetchPriority="high"
        />
      </picture>
    </section>
  );
}
