export type SuggestedPack = {
  id: string;
  name: string;
  area: string;
  members: number;
};

export const SUGGESTED_PACKS: SuggestedPack[] = [
  {
    id: 'pack-morning-walkers',
    name: 'Morning Walkers',
    area: 'Near your locality',
    members: 24,
  },
  {
    id: 'pack-weekend-park',
    name: 'Weekend Park Pack',
    area: 'City parks',
    members: 41,
  },
  {
    id: 'pack-adopters-circle',
    name: 'Adopters Circle',
    area: 'Your city',
    members: 18,
  },
];

/** Demo pin coordinates by city name (approx). */
export const CITY_PIN_PRESETS: Record<string, { latitude: number; longitude: number }> = {
  Bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  Bangalore: { latitude: 12.9716, longitude: 77.5946 },
  Mumbai: { latitude: 19.076, longitude: 72.8777 },
  Delhi: { latitude: 28.6139, longitude: 77.209 },
  Hyderabad: { latitude: 17.385, longitude: 78.4867 },
  Chennai: { latitude: 13.0827, longitude: 80.2707 },
  Pune: { latitude: 18.5204, longitude: 73.8567 },
};

export const DEFAULT_PIN = { latitude: 12.9716, longitude: 77.5946 };
