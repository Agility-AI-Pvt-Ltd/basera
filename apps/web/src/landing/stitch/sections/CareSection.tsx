import { LANDING_IMG } from '../landingAssets';
import { MaterialSymbol } from '../MaterialSymbol';
import { PhoneMockup } from '../PhoneMockup';
import { CARE_TAB_ACTIVE, CARE_TAB_INACTIVE } from '../pillClasses';

type CareTab = 'health' | 'training' | 'nutrition';

type CareSectionProps = {
  activeTab: CareTab;
  onTabChange: (tab: CareTab) => void;
};

const TABS: { id: CareTab; label: string }[] = [
  { id: 'health', label: 'Health & Vax' },
  { id: 'training', label: 'Training Tracker' },
  { id: 'nutrition', label: 'Nutrition & Weight' },
];

export function CareSection({ activeTab, onTabChange }: CareSectionProps) {
  return (
    <section className="w-full py-space-xl bg-surface-container-low" id="care">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="text-center max-w-2xl mx-auto mb-space-lg">
          <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
            Daily Wellness
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
            Health, training, and meals on the pet&apos;s own profile
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Because every Indie, Beagle, Persian, or Indie kitten has unique dietary, seasonal
            tick-flea, and vaccination routines in India.
          </p>
        </div>
        <div className="flex justify-center mb-space-xl px-2">
          <div className="inline-flex flex-wrap justify-center gap-1 p-1 rounded-full bg-surface-container-lowest shadow-sm max-w-full">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? CARE_TAB_ACTIVE : CARE_TAB_INACTIVE}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
              <div className="flex items-center gap-space-md">
                <div className="relative w-16 h-16 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="text-primary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="75, 100"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-title-md text-title-md text-primary font-bold">
                    75%
                  </span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-on-surface">
                    3 of 4 check-ups completed
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Bruno is in optimal health this quarter!
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-space-md py-1.5 rounded-full bg-surface-container-high text-primary font-label-md text-label-md hover:bg-primary-fixed transition-colors"
              >
                View Health Pass
              </button>
            </div>
            {[
              {
                icon: 'vaccines',
                iconBg: 'bg-error-container text-on-error-container',
                title: 'Rabies Annual Booster',
                sub: 'Oct 24 • Scheduled with Dr. Sen, VetCare Indiranagar',
                pill: 'Due This Week',
                pillClass: 'bg-secondary-fixed text-on-secondary-fixed',
              },
              {
                icon: 'shower',
                iconBg: 'bg-surface-container-high text-primary',
                title: 'De-shedding & Paw Grooming',
                sub: 'Nov 02 • Booked at PawSpa Studio, Koramangala',
                pill: 'Booked',
                pillClass: 'bg-surface-container text-on-surface-variant',
              },
              {
                icon: 'medication',
                iconBg: 'bg-secondary-fixed text-secondary',
                title: 'Deworming Chewable',
                sub: 'Nov 15 • Simparica Trio tablet reminder',
                pill: 'Upcoming',
                pillClass: 'bg-surface-container-low text-on-surface-variant',
              },
            ].map((row) => (
              <div
                key={row.title}
                className="p-space-md rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-space-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${row.iconBg}`}
                  >
                    <MaterialSymbol name={row.icon} size={20} />
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-title-md text-title-md text-on-surface truncate">
                      {row.title}
                    </h5>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{row.sub}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm font-semibold shrink-0 ${row.pillClass}`}
                >
                  {row.pill}
                </span>
              </div>
            ))}
            <div className="p-space-md rounded-2xl bg-primary-fixed/50 flex items-center gap-space-sm">
              <MaterialSymbol name="share" size={20} className="text-primary" />
              <p className="font-body-sm text-body-sm text-on-surface">
                <strong className="font-semibold text-primary">1-Tap Vet Sharing:</strong> Export
                Bruno&apos;s complete vaccination timeline &amp; prescription history as an
                encrypted PDF on WhatsApp to any vet in India.
              </p>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            {activeTab === 'health' ? (
              <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-space-lg shadow-xl flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase text-secondary font-bold">
                      Growth &amp; Weight Log
                    </span>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface mt-0.5">
                      24.2 kg{' '}
                      <span className="text-xs text-emerald-600 font-semibold font-mono">
                        +0.4kg this mo
                      </span>
                    </h4>
                  </div>
                  <span className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                    <MaterialSymbol name="monitoring" size={20} className="text-primary" />
                  </span>
                </div>
                <div className="w-full h-32 bg-surface rounded-2xl p-3 flex flex-col justify-end">
                  <svg className="w-full h-24" fill="none" viewBox="0 0 240 80">
                    <defs>
                      <linearGradient id="careChart" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,65 Q30,60 60,52 T120,44 T180,32 T240,20 L240,80 L0,80 Z"
                      fill="url(#careChart)"
                    />
                    <path
                      d="M0,65 Q30,60 60,52 T120,44 T180,32 T240,20"
                      fill="none"
                      stroke="#7c3aed"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                    <circle cx="240" cy="20" fill="#630ed4" r="4" />
                  </svg>
                  <div className="flex justify-between text-[11px] font-mono text-on-surface-variant pt-1">
                    <span>May</span>
                    <span>Jul</span>
                    <span>Sep</span>
                    <span>Nov</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                    Today&apos;s Routine
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-surface-container-high text-center">
                      <MaterialSymbol name="directions_walk" size={18} className="text-primary mx-auto" />
                      <p className="font-label-sm text-label-sm text-on-surface mt-1">45 min</p>
                      <span className="text-[10px] text-primary font-bold">Walked</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-secondary-fixed text-center">
                      <MaterialSymbol name="restaurant" size={18} className="text-secondary mx-auto" />
                      <p className="font-label-sm text-label-sm text-on-surface mt-1">2/2 Meals</p>
                      <span className="text-[10px] text-secondary font-bold">Fed</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container text-center">
                      <MaterialSymbol name="pill" size={18} className="text-on-surface-variant mx-auto" />
                      <p className="font-label-sm text-label-sm text-on-surface mt-1">Omega-3</p>
                      <span className="text-[10px] text-on-surface-variant font-bold">Given</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <PhoneMockup
                src={
                  activeTab === 'training'
                    ? LANDING_IMG.trainingPhone
                    : LANDING_IMG.nutritionPhone
                }
                alt={
                  activeTab === 'training'
                    ? 'Training routine in The Tailz Club app'
                    : 'Nutrition plan in The Tailz Club app'
                }
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
