export type GeoPoint = { latitude: number; longitude: number };

/** Haversine distance in kilometers. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistanceKm(km: number | null | undefined): string {
  if (km == null || Number.isNaN(km)) return 'Nearby';
  if (km < 1) return `${Math.round(km * 10) / 10} km away`;
  return `${Math.round(km * 10) / 10} km away`;
}

export function withDistance<T extends { latitude: number | null; longitude: number | null }>(
  items: T[],
  origin: GeoPoint | null,
): (T & { distanceKm?: number })[] {
  if (!origin) return items;
  return items
    .map((item) => {
      if (item.latitude == null || item.longitude == null) return { ...item, distanceKm: undefined };
      return {
        ...item,
        distanceKm: distanceKm(origin, { latitude: item.latitude, longitude: item.longitude }),
      };
    })
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
}
