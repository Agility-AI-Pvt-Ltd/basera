import { LANDING_IMG } from '../landingAssets';
import { PhoneMockup } from '../PhoneMockup';

const STEPS = [
  {
    n: 1,
    circle: 'bg-primary-fixed text-on-primary-fixed',
    title: 'Find a pet with complete transparency',
    body: 'Browse verified shelters, independent fosters, and rescue volunteers. View detailed temperament logs, medical history records, and neighborhood location tags.',
  },
  {
    n: 2,
    circle: 'bg-secondary-fixed text-on-secondary-fixed',
    title: 'Apply & direct message the rescuer',
    body: 'Chat directly inside the Tailz app. Schedule an initial video introduction and answer a thoughtful, short pet parent questionnaire.',
  },
  {
    n: 3,
    circle: 'bg-surface-container-high text-primary',
    title: 'Meet, greet & friendly home check',
    body: 'Arrange a peaceful park meet or home visit to evaluate compatibility. Sign our mutual digital adoption covenant with 1-click legal protection.',
  },
  {
    n: 4,
    circle: 'bg-primary text-on-primary',
    title: 'Handover & welfare check-ins',
    body: 'Welcome your new companion home! Tailz guides you through automatic Day 7, Day 30, and Day 90 wellness milestones with our certified Indian vet network.',
  },
] as const;

export function AdoptSection() {
  return (
    <section className="w-full py-space-xl bg-surface" id="adopt">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                Safe &amp; Compassionate
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
                A respectful, transparent adoption journey
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-lg">
                Designed in partnership with premier Indian animal rescue collectives to ensure
                every paw lands in a secure, loving home without red tape or shady brokers.
              </p>
            </div>
            <div className="flex flex-col gap-space-md pt-space-xs">
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow flex items-start gap-space-md"
                >
                  <div
                    className={`w-10 h-10 rounded-full font-headline-sm text-headline-sm flex items-center justify-center shrink-0 font-bold ${step.circle}`}
                  >
                    {step.n}
                  </div>
                  <div>
                    <h4 className="font-title-md text-title-md text-on-surface">{step.title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <PhoneMockup
              src={LANDING_IMG.adoptionPhone}
              alt="The Tailz Club Adopt screen with featured pets and ways to browse"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
