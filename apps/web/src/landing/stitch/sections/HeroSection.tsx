import { Link } from 'react-router-dom';

import { PLAY_STORE_URL } from '../../../config';
import { LANDING_IMG } from '../landingAssets';
import { MaterialSymbol } from '../MaterialSymbol';
import { LANDING_BTN_PRIMARY, SPECIES_PILL_ACTIVE, SPECIES_PILL_INACTIVE } from '../pillClasses';

const SPECIES = ['All', 'Dogs 🐕', 'Cats 🐈', 'Birds 🦜', 'Rabbits 🐇', 'Fish 🐟'] as const;

type HeroSectionProps = {
  activeSpecies: string;
  onSpeciesChange: (label: string) => void;
};

export function HeroSection({ activeSpecies, onSpeciesChange }: HeroSectionProps) {
  return (
    <section className="relative w-full overflow-hidden bg-surface py-space-xl lg:py-margin-lg">
      <div className="pointer-events-none absolute -top-24 -left-20 w-96 h-96 rounded-full bg-secondary-fixed/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-[32rem] h-[32rem] rounded-full bg-primary-fixed/40 blur-3xl" />
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          <div className="lg:col-span-7 flex flex-col items-start gap-space-md">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-high shadow-sm">
              <span className="text-secondary text-sm">🐾</span>
              <span className="font-label-md text-label-md text-on-surface">
                Adoption, care, and community in India
              </span>
            </div>
            <h1 className="font-display text-display text-on-surface tracking-tight">
              Bring a pet home.
              <br />
              <span className="text-primary font-display">Stay for the everyday.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Find verified rescue and companion pets nearby in Indian cities. Track vaccinations,
              nutrition milestones, and connect with verified local dog parks, neighbourhood packs,
              and QR collar registries.
            </p>
            <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
              {SPECIES.map((label) => (
                <button
                  key={label}
                  type="button"
                  className={activeSpecies === label ? SPECIES_PILL_ACTIVE : SPECIES_PILL_INACTIVE}
                  onClick={() => onSpeciesChange(label)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
              <a
                className={`${LANDING_BTN_PRIMARY} px-4 py-2 hover:-translate-y-0.5`}
                href={PLAY_STORE_URL || '#get-app'}
                target={PLAY_STORE_URL ? '_blank' : undefined}
                rel={PLAY_STORE_URL ? 'noopener noreferrer' : undefined}
              >
                <MaterialSymbol name="download" size={20} />
                <span>Get the app</span>
              </a>
              <Link
                className="inline-flex items-center gap-1.5 bg-surface-container-lowest text-primary border border-primary/25 hover:bg-primary hover:text-on-primary hover:border-primary font-label-md text-label-md px-4 py-2 rounded-full shadow-md transition-all hover:-translate-y-0.5 whitespace-nowrap"
                to="/tag"
              >
                <MaterialSymbol name="shield" size={20} className="text-primary" fill />
                <span>Look up a collar</span>
              </Link>
            </div>
            <div className="flex items-center gap-space-xs text-on-surface-variant pt-space-xs">
              <div className="flex text-secondary-container">
                <MaterialSymbol name="star" size={18} className="text-secondary" fill />
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                <strong className="text-on-surface">4.9 on Google Play</strong> • 14,000+ pets
                rehomed • 42+ city packs
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="relative overflow-hidden rounded-[2rem] shadow-2xl bg-surface-container-lowest p-2">
                <img
                  className="w-full h-[440px] md:h-[500px] object-cover rounded-[1.75rem]"
                  alt="A beagle and tabby cat resting together in a warm Indian home"
                  src={LANDING_IMG.hero}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/40 via-transparent to-transparent pointer-events-none rounded-[1.75rem]" />
              </div>
              <div className="absolute -top-6 -left-4 sm:-left-8 bg-surface-container-lowest/95 backdrop-blur-md p-space-md rounded-2xl shadow-xl flex items-center gap-space-md max-w-xs">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                  <img
                    className="w-full h-full object-cover"
                    alt="Golden retriever puppy"
                    src={LANDING_IMG.heroPetThumb}
                  />
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-title-md text-title-md text-on-surface truncate">Bruno</h4>
                    <MaterialSymbol name="favorite" size={16} className="text-error" fill />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    2.1 km • Indiranagar, BLR
                  </p>
                  <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm">
                    Vaccinated &amp; Trained
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-surface-container-lowest/95 backdrop-blur-md p-space-md rounded-2xl shadow-xl max-w-[270px]">
                <div className="flex items-start justify-between gap-space-xs mb-1">
                  <div className="flex items-center gap-space-xs">
                    <MaterialSymbol name="vaccines" size={20} className="text-secondary" />
                    <span className="font-label-sm text-label-sm uppercase tracking-wide text-secondary font-bold">
                      Care Alert
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold">
                    Friday
                  </span>
                </div>
                <p className="font-title-md text-title-md text-on-surface leading-tight">
                  Rabies booster for Milo
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  10:30 AM • Dr. Sharma Clinic
                </p>
                <div className="mt-space-xs flex items-center justify-between pt-1">
                  <span className="font-label-sm text-label-sm text-primary font-semibold cursor-pointer hover:underline">
                    Snooze
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-space-sm py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm hover:bg-[#5200b3] transition-colors shadow-sm"
                  >
                    <MaterialSymbol name="check" size={14} />
                    <span>Mark Done</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
