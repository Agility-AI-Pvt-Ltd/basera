import { Link } from 'react-router-dom';

import { MaterialSymbol } from '../MaterialSymbol';

export function CollarSection() {
  return (
    <section
      className="w-full py-space-xl bg-inverse-surface text-inverse-on-surface relative overflow-hidden"
      id="collartags"
    >
      <div className="pointer-events-none absolute -top-12 right-0 w-80 h-80 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-10 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl" />
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-primary-container text-on-primary-container self-start">
              <MaterialSymbol name="qr_code_2" size={16} />
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">
                Connected Safety Initiative
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-inverse-on-surface">
              Smart Community Collar Tags for Street &amp; Pet Animals in India.
            </h2>
            <p className="font-body-lg text-body-lg text-surface-variant/90 max-w-xl">
              Reflective, rust-proof stainless steel tags with instant QR &amp; NFC lookup.
              Strangers can immediately access the animal&apos;s anti-rabies status and phone the
              foster or colony feeder—without revealing private home addresses.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-space-xs">
              <div className="p-space-md rounded-2xl bg-surface-container-highest/10 backdrop-blur-sm">
                <MaterialSymbol name="verified" size={24} className="text-secondary-fixed" />
                <h4 className="font-title-md text-title-md text-inverse-on-surface mt-1">
                  Rabies on Record
                </h4>
                <p className="font-body-sm text-body-sm text-surface-variant/80 mt-0.5">
                  Municipal authorities and citizens can verify vaccination date in 3 seconds.
                </p>
              </div>
              <div className="p-space-md rounded-2xl bg-surface-container-highest/10 backdrop-blur-sm">
                <MaterialSymbol name="call" size={24} className="text-primary-fixed" />
                <h4 className="font-title-md text-title-md text-inverse-on-surface mt-1">
                  Masked Caregiver Dial
                </h4>
                <p className="font-body-sm text-body-sm text-surface-variant/80 mt-0.5">
                  Safe cloud calling protects female pet parents and feeders from spam calls.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-md pt-space-sm">
              <Link
                to="/tag"
                className="px-space-xl py-space-sm rounded-full bg-primary text-on-primary hover:bg-[#5200b3] font-label-lg text-label-lg font-bold shadow-[0_4px_18px_rgba(99,14,212,0.38)] transition-all inline-block text-center"
              >
                Verify a tag
              </Link>
              <button
                type="button"
                className="px-space-xl py-space-sm rounded-full bg-secondary text-on-secondary hover:bg-[#6b3f0f] font-label-lg text-label-lg transition-all shadow-md"
              >
                Order tags for your street pack / colony
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-surface-container-highest/15 backdrop-blur-md rounded-3xl p-space-lg shadow-2xl flex flex-col items-center text-center">
              <div className="relative w-44 h-44 rounded-full bg-gradient-to-tr from-surface-container-highest via-surface to-secondary-fixed p-1 shadow-2xl flex items-center justify-center mb-space-md">
                <div className="w-full h-full rounded-full bg-inverse-surface flex flex-col items-center justify-center p-4">
                  <span className="font-mono text-[11px] text-secondary-fixed font-bold tracking-widest">
                    TAG #BLR-8841
                  </span>
                  <div className="w-16 h-16 bg-surface p-1 rounded-lg my-1 flex items-center justify-center">
                    <MaterialSymbol name="qr_code_2" size={48} className="text-inverse-surface" />
                  </div>
                  <span className="font-label-sm text-label-sm text-surface-variant">Tap or Scan</span>
                </div>
              </div>
              <div className="w-full bg-inverse-surface/80 rounded-2xl p-space-md space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-title-md text-inverse-on-surface font-bold">
                    Bruno (Community Care)
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-label-sm text-label-sm rounded-full font-semibold">
                    Active
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-surface-variant">
                  Rabies Booster: <strong>Valid till Nov 2025</strong>
                </p>
                <p className="font-body-sm text-body-sm text-surface-variant">
                  Primary Feeder: <strong>Riya S. (Indiranagar, BLR)</strong>
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-primary-fixed">
                  <span>NFC Chip Enabled</span>
                  <span>Weatherproof 316 Steel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
