import type { AdoptionListing } from '@/types/adoption';

const LOCATION_CODE: Record<string, string> = {
  same_city: 'same_city',
  'same city': 'same_city',
};

export function formatListingDistance(
  listing: AdoptionListing,
  fallbackCity = 'Noida',
): string {
  const raw = listing.publicLocationLabel?.trim().toLowerCase() ?? '';
  const city = listing.city?.trim() || fallbackCity;

  if (LOCATION_CODE[raw] || raw === 'same_city') {
    const km =
      listing.adoptionRadius?.trim() ||
      (/\d+\s*km/i.test(listing.publicLocationLabel) ? listing.publicLocationLabel : '3 km away');
    const kmLabel = /\d\s*km/i.test(km) ? km.replace(/\s*away/i, '').trim() + ' away' : `${km} away`;
    return `${city} · ${kmLabel}`;
  }

  if (raw && !raw.includes('_') && raw.length > 2) {
    return listing.publicLocationLabel.trim();
  }

  if (listing.adoptionRadius?.trim()) {
    return `${city} · ${listing.adoptionRadius}`;
  }

  return `${city} · Nearby`;
}

export function pluralPetCount(count: number): string {
  return count === 1 ? '1 Pet Available' : `${count} Pets Available`;
}