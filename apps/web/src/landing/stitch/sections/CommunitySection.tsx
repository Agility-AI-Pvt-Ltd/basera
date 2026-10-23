import { Link } from 'react-router-dom';

import { LANDING_IMG } from '../landingAssets';
import { MaterialSymbol } from '../MaterialSymbol';
import { PhoneMockup } from '../PhoneMockup';

export function CommunitySection() {
  return (
    <section className="w-full py-space-xl bg-surface" id="community">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <PhoneMockup
              src={LANDING_IMG.communityPhone}
              alt="The Tailz Club community screen with groups and posts from pet parents"
            />
          </div>
          <div className="lg:col-span-7 flex flex-col gap-space-md order-1 lg:order-2">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                Local Paws
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
                Never walk alone. Find your neighbourhood pack.
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl">
                From weekend coffee meetups to hyper-local SOS lost-pet search groups, Tailz links
                you with responsible pet parents in your immediate residential colony.
              </p>
            </div>
            <div className="flex flex-col gap-space-md pt-space-xs">
              {[
                {
                  icon: 'groups',
                  bg: 'bg-primary-fixed text-primary',
                  title: 'Micro-Local City Packs',
                  body: 'Join verified groups like ‘Bengaluru Indie Parents’, ‘Bandra Golden Club’, or ‘Gurgaon Sec 45 Morning Walkers’ to coordinate daily routines and share trusted vet recommendations.',
                },
                {
                  icon: 'event',
                  bg: 'bg-secondary-fixed text-secondary',
                  title: 'Agility & Socialization Meetups',
                  body: 'Attend supervised dog park sessions, indoor cat-sitting webinars, and pet-friendly cafe mixers where you and your fur companion can thrive together.',
                },
                {
                  icon: 'crisis_alert',
                  bg: 'bg-error-container text-error',
                  title: 'Community SOS & Trusted Pet-Sitting',
                  body: 'When traveling, exchange pet-sitting with verified neighbors instead of expensive boarding kennels. If a dog goes missing, one tap notifies all walkers within 3 km.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-space-md p-space-md rounded-2xl bg-surface-container-lowest shadow-sm"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.bg}`}
                  >
                    <MaterialSymbol name={item.icon} size={24} />
                  </div>
                  <div>
                    <h4 className="font-title-md text-title-md text-on-surface">{item.title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-space-xs">
              <Link
                className="inline-flex items-center gap-space-xs bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg px-space-xl py-space-sm rounded-full shadow-md transition-all"
                to="/community"
              >
                <MaterialSymbol name="explore" size={20} />
                <span>Open the community</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
