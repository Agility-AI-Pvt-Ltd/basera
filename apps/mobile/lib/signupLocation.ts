import * as Location from 'expo-location';

import type { LocalityPin } from '@/types/profile';

const GPS_TIMEOUT_MS = 20_000;

type ParsedPlace = {
  city: string;
  locality: string;
  label: string;
};

function buildLabel(city: string, locality: string): string {
  if (locality && city && locality !== city) {
    return `${locality}, ${city}`;
  }
  return city || locality;
}

function parseExpoAddress(place: Location.LocationGeocodedAddress): ParsedPlace {
  const city =
    place.city?.trim() ||
    place.subregion?.trim() ||
    place.district?.trim() ||
    place.region?.trim() ||
    '';

  const district = place.district?.trim() ?? '';
  const locationName =
    place.name?.trim() ||
    (district && district !== city ? district : '') ||
    place.street?.trim() ||
    '';

  const locality =
    locationName || (district && district !== city ? district : '') || city;

  return { city, locality, label: buildLabel(city, locality) };
}

function pickBestExpoAddress(places: Location.LocationGeocodedAddress[]): ParsedPlace {
  for (const place of places) {
    const parsed = parseExpoAddress(place);
    if (parsed.city.length >= 2) {
      return parsed;
    }
  }
  if (places[0]) {
    return parseExpoAddress(places[0]);
  }
  return { city: '', locality: '', label: '' };
}

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  residential?: string;
  road?: string;
  state?: string;
};

async function reverseGeocodeNominatim(pin: LocalityPin): Promise<ParsedPlace | null> {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(pin.latitude),
    lon: String(pin.longitude),
    zoom: '16',
    addressdetails: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'BaseraMobile/1.0 (signup location)',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    name?: string;
    display_name?: string;
    address?: NominatimAddress;
  };

  const address = data.address ?? {};
  const city =
    address.city?.trim() ||
    address.town?.trim() ||
    address.municipality?.trim() ||
    address.village?.trim() ||
    address.county?.trim() ||
    address.state_district?.trim() ||
    address.state?.trim() ||
    '';

  const locality =
    address.suburb?.trim() ||
    address.neighbourhood?.trim() ||
    address.quarter?.trim() ||
    address.residential?.trim() ||
    data.name?.trim() ||
    address.road?.trim() ||
    '';

  const resolvedLocality = locality || city;
  const resolvedCity = city || locality;

  if (resolvedCity.length < 2 && resolvedLocality.length < 2) {
    return null;
  }

  return {
    city: resolvedCity,
    locality: resolvedLocality,
    label: buildLabel(resolvedCity, resolvedLocality),
  };
}

async function reverseGeocodePin(pin: LocalityPin): Promise<ParsedPlace | null> {
  try {
    const places = await Location.reverseGeocodeAsync(pin);
    const expo = pickBestExpoAddress(places);
    if (expo.city.length >= 2) {
      return expo;
    }
  } catch {
    // fall through to Nominatim
  }

  try {
    return await reverseGeocodeNominatim(pin);
  } catch {
    return null;
  }
}

async function readGpsPin(): Promise<LocalityPin> {
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new Error('Turn on location services (GPS) in your device settings.');
  }

  const current = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('GPS timed out. Try again near a window or outdoors.')), GPS_TIMEOUT_MS);
  });

  try {
    const position = await Promise.race([current, timeout]);
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    const last = await Location.getLastKnownPositionAsync();
    if (last) {
      return {
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
      };
    }
    throw new Error('Could not get GPS coordinates. Check location permission and try Refresh.');
  }
}

export function formatPinCoordinates(pin: LocalityPin): string {
  return `${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`;
}

export type SignupLocationResult = {
  pin: LocalityPin;
  city: string;
  locality: string;
  label: string;
};

export async function detectSignupLocation(): Promise<
  { ok: true; data: SignupLocationResult } | { ok: false; message: string; pin?: LocalityPin }
> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return {
      ok: false,
      message: 'Allow location access so we can set your city and map pin.',
    };
  }

  let pin: LocalityPin;
  try {
    pin = await readGpsPin();
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not read GPS.',
    };
  }

  const parsed = await reverseGeocodePin(pin);
  if (!parsed || parsed.city.length < 2) {
    return {
      ok: false,
      message:
        'GPS pin saved. Could not resolve place name — check internet and tap Refresh, or enter city/locality.',
      pin,
    };
  }

  const locality = parsed.locality.length >= 2 ? parsed.locality : parsed.city;

  return {
    ok: true,
    data: {
      pin,
      city: parsed.city,
      locality,
      label: parsed.label || buildLabel(parsed.city, locality),
    },
  };
}
