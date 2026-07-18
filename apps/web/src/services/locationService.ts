export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type SelectedLocation = Coordinates & {
  timezone: string;
  displayName: string;
  city: string;
  state: string;
  country: string;
  source: 'browser' | 'manual';
};

export type CitySearchResult = Coordinates & {
  id: number;
  timezone: string;
  displayName: string;
  city: string;
  state: string;
  country: string;
};

type BigDataCloudReverseResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
};

type OpenMeteoGeocodingResponse = {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    timezone?: string;
    country?: string;
    admin1?: string;
  }>;
};

const BIG_DATA_CLOUD_REVERSE_URL =
  'https://api.bigdatacloud.net/data/reverse-geocode-client';
const OPEN_METEO_SEARCH_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export function getBrowserPosition(): Promise<Coordinates> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Geolocation is not supported in this browser'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        reject(new Error('Location permission was denied. Search for your city manually.'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  });
}

export async function reverseGeocodeCoordinates(
  coordinates: Coordinates,
): Promise<SelectedLocation> {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    localityLanguage: 'en',
  });

  const response = await fetch(`${BIG_DATA_CLOUD_REVERSE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Unable to detect city from your coordinates');
  }

  const data = (await response.json()) as BigDataCloudReverseResponse;
  const city = data.city || data.locality || 'Current Location';
  const state = data.principalSubdivision ?? '';
  const country = data.countryName ?? '';
  const displayName = formatLocationName([city, state, country]);

  return {
    ...coordinates,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    displayName,
    city,
    state,
    country,
    source: 'browser',
  };
}

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const params = new URLSearchParams({
    name: query,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const response = await fetch(`${OPEN_METEO_SEARCH_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Unable to search cities');
  }

  const data = (await response.json()) as OpenMeteoGeocodingResponse;

  return (data.results ?? [])
    .filter((result) => result.timezone)
    .map((result) => ({
      id: result.id,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone as string,
      city: result.name,
      state: result.admin1 ?? '',
      country: result.country ?? '',
      displayName: formatLocationName([result.name, result.admin1, result.country]),
    }));
}

function formatLocationName(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(', ');
}
