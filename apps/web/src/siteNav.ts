export type SiteNavItem =
  | { kind: 'hash'; hash: string; label: string }
  | { kind: 'route'; to: string; label: string }
  | { kind: 'external'; href: string; label: string };

export const SITE_NAV: SiteNavItem[] = [
  { kind: 'hash', hash: '#adopt', label: 'Adopt' },
  { kind: 'hash', hash: '#care', label: 'Care' },
  { kind: 'hash', hash: '#community', label: 'Community' },
  { kind: 'route', to: '/activity', label: 'Activity' },
  { kind: 'route', to: '/tag', label: 'Collar tags' },
];
