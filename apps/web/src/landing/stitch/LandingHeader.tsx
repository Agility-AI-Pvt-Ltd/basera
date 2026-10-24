import { Link } from 'react-router-dom';

import { PLAY_STORE_URL } from '../../config';
import { BrandLogo } from './BrandLogo';
import { MaterialSymbol } from './MaterialSymbol';

const NAV = [
  { href: '#adopt', label: 'Adopt' },
  { href: '#care', label: 'Care' },
  { href: '#community', label: 'Community' },
  { href: '#collartags', label: 'Collar Tags' },
] as const;

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fff6ef]/85 backdrop-blur-md shadow-[0_1px_8px_rgba(44,27,51,0.04)]">
      <div className="h-16 lg:h-20 max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between gap-3 min-w-0">
        <Link to="/" className="flex items-center gap-2 min-w-0 shrink-0">
          <BrandLogo size={20} />
          <span className="font-title-md text-title-md text-on-background font-bold tracking-tight truncate leading-tight">
            The Tailz Club
          </span>
        </Link>
        <nav
          className="hidden lg:flex items-center justify-center gap-3 xl:gap-5 flex-1 min-w-0 px-1 overflow-hidden"
          aria-label="Primary"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              className="inline-flex items-center font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors duration-200 whitespace-nowrap py-1 px-0.5"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            className="inline-flex items-center gap-1.5 bg-primary hover:bg-[#5200b3] text-on-primary font-label-md text-label-md px-3 sm:px-4 py-2 rounded-full shadow-[0_4px_18px_rgba(99,14,212,0.38)] hover:shadow-[0_6px_24px_rgba(99,14,212,0.48)] transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
            href={PLAY_STORE_URL || '#get-app'}
            target={PLAY_STORE_URL ? '_blank' : undefined}
            rel={PLAY_STORE_URL ? 'noopener noreferrer' : undefined}
          >
            <MaterialSymbol name="download" size={18} />
            <span>Get the App</span>
          </a>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <MaterialSymbol name="person" size={18} className="text-on-primary" />
          </div>
        </div>
      </div>
    </header>
  );
}
