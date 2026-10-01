import './phone.css';

const SCREENS = [
  {
    id: 'adoption',
    src: '/landing%20page/adoption_page.png',
    alt: 'Adoption screen',
    className: 'phone__screen--adoption',
  },
  {
    id: 'community',
    src: '/landing%20page/community_page.png',
    alt: 'Community screen',
    className: 'phone__screen--community',
  },
  {
    id: 'nutrition',
    src: '/landing%20page/nutrition_page.png',
    alt: 'Nutrition screen',
    className: 'phone__screen--nutrition',
  },
  {
    id: 'training',
    src: '/landing%20page/training_page.png',
    alt: 'Training screen',
    className: 'phone__screen--training',
  },
] as const;

export function PhoneSection() {
  return (
    <section className="phone" id="app" aria-label="Basera app screens">
      <div className="phone__stage">
        <div className="phone__canvas">
          <img
            className="phone__bg"
            src="/landing%20page/phone_bg.png"
            alt=""
            fetchPriority="low"
          />
          {SCREENS.map((screen) => (
            <img
              key={screen.id}
              className={`phone__screen ${screen.className}`}
              src={screen.src}
              alt={screen.alt}
              loading="lazy"
            />
          ))}
        </div>
      </div>

      <img
        className="phone__hero-overlay"
        src="/landing%20page/hero_img.png"
        alt=""
        loading="lazy"
      />
    </section>
  );
}
