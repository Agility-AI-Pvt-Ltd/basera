export const INSTAGRAM_HANDLE =
  import.meta.env.VITE_INSTAGRAM_HANDLE?.trim() || 'thetailzclub';

export const YOUTUBE_CHANNEL_URL =
  import.meta.env.VITE_YOUTUBE_CHANNEL_URL?.trim() ||
  'https://www.youtube.com/@thetailzclub';

export const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

function parseCsv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Full Instagram post/reel URLs, e.g. https://www.instagram.com/p/ABC123/ */
export const INSTAGRAM_POST_URLS = parseCsv(import.meta.env.VITE_INSTAGRAM_POST_URLS);

/** YouTube video IDs (the part after watch?v=), not full URLs */
export const YOUTUBE_VIDEO_IDS = parseCsv(import.meta.env.VITE_YOUTUBE_VIDEO_IDS);

export type ActivityHighlight = {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  source: string;
  dateLabel?: string;
};

/** In-app and web updates shown alongside social embeds */
export const ACTIVITY_HIGHLIGHTS: ActivityHighlight[] = [
  {
    id: 'collar-tags',
    title: 'Collar tags for community animals',
    excerpt:
      'Look up a tag, log sightings, and help caretakers keep vaccination and feeding notes in one place.',
    href: '/tag',
    source: 'The Tailz Club',
    dateLabel: 'Product',
  },
  {
    id: 'global-community',
    title: 'Global community feed',
    excerpt:
      'Pet parents share adoption stories, meetups, and everyday care wins — join the conversation in the app.',
    href: '/community',
    source: 'Community',
    dateLabel: 'Feature',
  },
  {
    id: 'adoption-journey',
    title: 'Adoption from application to day 90',
    excerpt:
      'Structured steps, messaging, and post-adoption check-ins so handover day is not the last time you hear from each other.',
    href: '/#adopt',
    source: 'Adopt',
    dateLabel: 'Guide',
  },
];
