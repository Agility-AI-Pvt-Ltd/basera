import { Menu, PawPrint, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { PLAY_STORE_URL } from '../config';
import { SITE_NAV } from '../siteNav';

function PawMark() {
  return (
    <span className="lp-brand__mark" aria-hidden>
      <PawPrint size={16} strokeWidth={2.4} />
    </span>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="lp-header">
      <Link className="lp-brand" to="/" onClick={closeMenu}>
        <PawMark />
        The Tailz Club
      </Link>

      <button
        type="button"
        className="lp-nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="lp-nav"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
        <span className="lp-sr">{menuOpen ? 'Close menu' : 'Open menu'}</span>
      </button>

      <nav id="lp-nav" className={`lp-nav${menuOpen ? ' is-open' : ''}`} aria-label="Site">
        {SITE_NAV.map((item) => {
          const isActive =
            item.kind === 'route' && location.pathname === item.to;
          const className = isActive ? 'is-active' : undefined;

          if (item.kind === 'route') {
            return (
              <Link key={item.to} to={item.to} className={className} onClick={closeMenu}>
                {item.label}
              </Link>
            );
          }

          if (item.kind === 'hash') {
            const href = location.pathname === '/' ? item.hash : `/${item.hash}`;
            return (
              <a key={item.hash} href={href} className={className} onClick={closeMenu}>
                {item.label}
              </a>
            );
          }

          return (
            <a key={item.href} href={item.href} className={className} onClick={closeMenu}>
              {item.label}
            </a>
          );
        })}
        <a
          className="lp-nav__download"
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get the app
        </a>
      </nav>

      <a
        className="btn btn--primary btn--sm lp-header__cta"
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        Get the app
      </a>
    </header>
  );
}
