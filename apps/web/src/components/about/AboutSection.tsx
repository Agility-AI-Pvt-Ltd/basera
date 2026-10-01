import './about.css';

import { ABOUT_ASSETS } from './aboutAssets';
import { BulbIcon, PawIcon, SparkMarks, TargetIcon } from './AboutIcons';

const POINTS = [
  {
    id: 'problem',
    title: 'The Problem',
    body: 'Finding a pet to adopt is only the beginning. Pet parents often need trusted information, training guidance, nutrition advice, healthcare reminders, and a community they can rely on.',
    tone: 'purple' as const,
    Icon: PawIcon,
  },
  {
    id: 'solution',
    title: 'The Solution',
    body: 'Basera connects adoption and everyday pet care in one place — helping people discover pets, learn, share, and care better.',
    tone: 'orange' as const,
    Icon: BulbIcon,
  },
  {
    id: 'goal',
    title: 'Our Goal',
    body: 'Make responsible pet ownership simpler, more accessible, and more connected for every pet and pet parent.',
    tone: 'red' as const,
    Icon: TargetIcon,
  },
];

function DecorHearts() {
  return (
    <svg className="about__hearts" viewBox="0 0 48 32" width="48" height="32" aria-hidden>
      <path
        d="M12 8c-3 0-5 2.2-5 5.2 0 4.8 5 8.8 5 8.8s5-4 5-8.8C17 10.2 15 8 12 8z"
        fill="#7c3aed"
      />
      <path
        d="M28 10c-2.2 0-4 1.6-4 3.8 0 3.5 4 6.5 4 6.5s4-3 4-6.5C32 11.6 30.2 10 28 10z"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
      />
    </svg>
  );
}

function DecorZzz() {
  return <span className="about__zzz" aria-hidden>zzz</span>;
}

function DecorDottedLine() {
  return (
    <svg className="about__dotted-line" viewBox="0 0 200 120" aria-hidden>
      <path
        d="M10 100 C 40 90, 70 40, 120 55 S 180 30, 190 20"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2"
        strokeDasharray="4 8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DecorPaw() {
  return (
    <svg className="about__paw-mark" viewBox="0 0 64 64" width="64" height="64" aria-hidden>
      <circle cx="20" cy="18" r="6" fill="#ddd6fe" />
      <circle cx="32" cy="14" r="5.5" fill="#ddd6fe" />
      <circle cx="44" cy="20" r="5" fill="#ddd6fe" />
      <circle cx="16" cy="28" r="4.5" fill="#ddd6fe" />
      <ellipse cx="30" cy="38" rx="14" ry="16" fill="#ddd6fe" />
    </svg>
  );
}

export function AboutSection() {
  return (
    <section className="about" id="about" aria-labelledby="about-heading">
      <div className="about__inner">
        <div className="about__top">
          <div className="about__intro">
            <span className="about__eyebrow">About Basera</span>
            <h2 className="about__heading" id="about-heading">
              <span className="about__heading-line">
                A better life
                <SparkMarks color="orange" />
              </span>
              <span className="about__heading-line about__heading-line--orange">for every pet.</span>
            </h2>
            <p className="about__lead">
              Basera brings pet adoption, everyday care, and a trusted pet community together in one
              simple app — built for pet parents who truly care.
            </p>

            <div className="about__visual">
              <DecorDottedLine />
              <DecorPaw />
              <DecorHearts />
              <DecorZzz />
              <img
                className="about__kitten"
                src={ABOUT_ASSETS.kitten}
                alt="Sleeping kitten"
                width={720}
                height={480}
                loading="lazy"
              />
            </div>
          </div>

          <ul className="about__points">
            {POINTS.map(({ id, title, body, tone, Icon }) => (
              <li key={id} className={`about-point about-point--${tone}`}>
                <div className="about-point__icon-wrap">
                  <Icon className="about-point__icon" />
                </div>
                <div className="about-point__body">
                  <h3 className="about-point__title">
                    {title}
                    <SparkMarks color={tone === 'red' ? 'red' : tone} />
                  </h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
