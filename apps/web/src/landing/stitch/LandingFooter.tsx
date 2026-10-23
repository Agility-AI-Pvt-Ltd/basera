import { BrandLogo } from './BrandLogo';
import { MaterialSymbol } from './MaterialSymbol';

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-surface-container-low text-on-surface">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg pt-space-xl pb-space-lg">
        <div className="bg-surface-container-lowest rounded-xl p-space-lg mb-space-xl shadow-[0_4px_20px_-2px_rgba(44,27,51,0.05)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md mb-space-md">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                The Pack Chronicle
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
                Stories from the Pack
              </h3>
            </div>
            <a
              className="inline-flex items-center gap-space-xs font-label-md text-label-md text-primary hover:text-primary-container transition-colors"
              href="#community"
            >
              <span>View all community journals</span>
              <MaterialSymbol name="arrow_forward" size={16} />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {[
              {
                icon: 'pets',
                iconClass: 'text-secondary',
                label: 'Adoption Tale',
                labelClass: 'text-secondary',
                text: 'How Indie pup Milo found his forever home in Koramangala, Bengaluru.',
              },
              {
                icon: 'health_and_safety',
                iconClass: 'text-primary',
                label: 'Wellness Guide',
                labelClass: 'text-primary',
                text: 'Monsoon ear care and paw protection tips verified by veterinary partners.',
              },
              {
                icon: 'qr_code_2',
                iconClass: 'text-tertiary',
                label: 'Collar Rescue',
                labelClass: 'text-tertiary',
                text: 'Instant NFC tag reconnects lost Golden Retriever Bruno in Bandra within 40 minutes.',
              },
            ].map((card) => (
              <div key={card.label} className="p-space-md rounded-lg bg-surface-container-low">
                <div className="flex items-center gap-space-xs mb-space-xs">
                  <MaterialSymbol name={card.icon} size={18} className={card.iconClass} />
                  <span className={`font-label-sm text-label-sm font-bold ${card.labelClass}`}>
                    {card.label}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter-lg pb-space-xl">
          <div className="md:col-span-5 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <BrandLogo size={20} />
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                The Tailz Club
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              India&apos;s warm pet adoption, daily wellness &amp; community collar network.
              Building connected, happy lives for every tail across our cities.
            </p>
            <div className="flex items-center gap-space-sm text-on-surface-variant pt-space-xs">
              {['forum', 'photo_camera', 'podcasts'].map((icon) => (
                <a
                  key={icon}
                  aria-label={icon}
                  className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"
                  href="#activity"
                >
                  <MaterialSymbol name={icon} size={18} />
                </a>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 flex flex-col gap-space-sm">
            <h4 className="font-title-md text-title-md text-on-surface">Explore The Pack</h4>
            <ul className="flex flex-col gap-space-xs">
              {[
                ['#adopt', 'Adopt a Pet'],
                ['#care', 'Care & Wellness Reminders'],
                ['#activity', 'Daily Activity Tracker'],
                ['#community', 'Neighborhood Walking Clubs'],
                ['#collartags', 'Smart QR & NFC Collar Tags'],
              ].map(([href, label]) => (
                <li key={href} className="font-body-sm text-body-sm">
                  <a
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    href={href}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-3 flex flex-col gap-space-sm">
            <h4 className="font-title-md text-title-md text-on-surface">Support &amp; Contact</h4>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Have questions, rescue cases, or collar tag queries? Reach out anytime:
            </p>
            <a
              className="inline-flex items-center gap-space-xs font-label-lg text-label-lg text-primary hover:text-primary-container transition-colors"
              href="mailto:support@thetailzclub.in"
            >
              <MaterialSymbol name="mail" size={18} />
              <span>support@thetailzclub.in</span>
            </a>
            <div className="mt-space-xs flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
              <MaterialSymbol name="location_on" size={18} className="text-secondary" />
              <span>Bengaluru • Mumbai • Delhi NCR</span>
            </div>
          </div>
        </div>
        <div className="pt-space-md border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant text-center sm:text-left">
            © {year} The Tailz Club. Made with love for pet parents in India.
          </p>
          <div className="flex items-center gap-space-md">
            {['Privacy Policy', 'Terms of Service', 'Collar Setup'].map((label) => (
              <a
                key={label}
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
                href="#"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
