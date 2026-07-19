import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredManualLocation = {
  displayName: string;
  id: number;
  latitude: number;
  longitude: number;
  timezone: string;
};

export type StoredLocationPreference =
  | { mode: 'approximate' }
  | { mode: 'device' }
  | { location: StoredManualLocation; mode: 'manual' };

const LOCATION_PREFERENCE_KEY = 'planetary-hours.location-preference.v1';

export async function readLocationPreference(): Promise<StoredLocationPreference | null> {
  try {
    const value = await AsyncStorage.getItem(LOCATION_PREFERENCE_KEY);

    if (!value) {
      return null;
    }

    return parseLocationPreference(JSON.parse(value) as unknown);
  } catch {
    return null;
  }
}

export async function saveLocationPreference(preference: StoredLocationPreference) {
  await AsyncStorage.setItem(LOCATION_PREFERENCE_KEY, JSON.stringify(preference));
}

function parseLocationPreference(value: unknown): StoredLocationPreference | null {
  if (!isRecord(value) || typeof value.mode !== 'string') {
    return null;
  }

  if (value.mode === 'approximate' || value.mode === 'device') {
    return { mode: value.mode };
  }

  if (value.mode !== 'manual' || !isRecord(value.location)) {
    return null;
  }

  const { displayName, id, latitude, longitude, timezone } = value.location;

  if (
    typeof displayName !== 'string' ||
    typeof id !== 'number' ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    typeof timezone !== 'string'
  ) {
    return null;
  }

  return {
    location: {
      displayName,
      id,
      latitude,
      longitude,
      timezone,
    },
    mode: 'manual',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
