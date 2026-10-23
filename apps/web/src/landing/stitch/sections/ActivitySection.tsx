import { Link } from 'react-router-dom';

import { LANDING_IMG } from '../landingAssets';
import { MaterialSymbol } from '../MaterialSymbol';

const REELS = [
  {
    image: LANDING_IMG.activityReel1,
    alt: 'Family welcoming an indie foster puppy',
    kicker: '@thetailzclub • Reel',
    title: 'How to introduce a rescue Indie to your home',
  },
  {
    image: LANDING_IMG.activityReel2,
    alt: 'Dogs running together in Cubbon Park',
    kicker: 'Cubbon Park • Event',
    title: 'Cubbon Park Mega Meetup Recap • 64 Paws',
  },
  {
    image: LANDING_IMG.activityReel3,
    alt: 'Volunteers attaching smart collar tags on community dogs',
    kicker: 'Delhi Drives • Rescue',
    title: 'Street Tag Rollout: 100 Colony Dogs Registered',
  },
] as const;

export function ActivitySection() {
  return (
    <section className="w-full py-space-xl bg-surface" id="activity">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-lg">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
              Pack Stories
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">
              Life with the pack
            </h2>
          </div>
          <Link
            to="/activity"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
          >
            Watch real rescues &amp; pack meetups →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
          {REELS.map((reel) => (
            <Link
              key={reel.title}
              to="/activity"
              className="group relative rounded-2xl overflow-hidden shadow-sm bg-surface-container-low aspect-[9/12] flex flex-col justify-end p-space-md"
            >
              <img
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt={reel.alt}
                src={reel.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/30 to-transparent" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center text-primary mb-2 shadow-sm group-hover:scale-110 transition-transform">
                  <MaterialSymbol name="play_arrow" size={20} fill />
                </div>
                <span className="text-xs font-mono text-secondary-fixed font-bold">{reel.kicker}</span>
                <h4 className="font-title-md text-title-md font-bold text-white mt-1">{reel.title}</h4>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
