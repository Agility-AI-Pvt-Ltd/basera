import { useState, type FormEvent } from 'react';

import { PLAY_STORE_URL } from '../../../config';
import { MaterialSymbol } from '../MaterialSymbol';

export function GetAppSection() {
  const [email, setEmail] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    window.alert('Welcome to The Tailz Club waitlist!');
    setEmail('');
  };

  return (
    <section className="w-full py-space-xl bg-surface-container-low" id="get-app">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg">
        <div className="relative overflow-hidden rounded-3xl bg-surface-container-lowest p-space-xl lg:p-margin-lg shadow-xl">
          <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary-fixed/40 blur-3xl" />
          <div className="pointer-events-none absolute -top-20 -left-20 w-80 h-80 rounded-full bg-secondary-fixed/50 blur-3xl" />
          <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-space-md">
            <div className="w-9 h-9 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <MaterialSymbol name="pets" size={18} className="text-primary" />
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Keep the leash, the calendar, and the pack in one app.
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Available soon on Android &amp; iOS across Indian cities. Join 25,000+ pet parents and
              rescue volunteers on our early access priority list.
            </p>
            <form
              className="w-full max-w-md flex flex-col sm:flex-row gap-space-xs mt-space-xs"
              onSubmit={onSubmit}
            >
              <input
                className="flex-1 px-space-lg py-space-sm rounded-full bg-surface text-on-surface placeholder:text-on-surface-variant/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary font-body-md text-body-md"
                placeholder="Enter your email address"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="px-space-xl py-space-sm rounded-full bg-primary hover:bg-[#5200b3] text-on-primary font-label-lg text-label-lg shadow-[0_4px_18px_rgba(99,14,212,0.38)] transition-all shrink-0"
                type="submit"
              >
                Notify Me
              </button>
            </form>
            <div className="flex flex-wrap items-center justify-center gap-space-md pt-space-md">
              <a
                className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-2xl bg-surface-container text-on-surface shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors"
                href={PLAY_STORE_URL || '#'}
                target={PLAY_STORE_URL ? '_blank' : undefined}
                rel={PLAY_STORE_URL ? 'noopener noreferrer' : undefined}
              >
                <MaterialSymbol name="play_arrow" size={28} className="text-primary" />
                <div className="text-left">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                    Get it on
                  </p>
                  <p className="font-label-lg text-label-lg font-bold text-on-surface leading-tight">
                    Google Play
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-space-xs px-space-lg py-2.5 rounded-2xl bg-surface-container text-on-surface shadow-sm cursor-pointer hover:bg-surface-container-high transition-colors">
                <MaterialSymbol name="phone_iphone" size={28} className="text-on-surface" />
                <div className="text-left">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                    Download on the
                  </p>
                  <p className="font-label-lg text-label-lg font-bold text-on-surface leading-tight">
                    Apple App Store
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
