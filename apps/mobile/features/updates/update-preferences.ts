import AsyncStorage from '@react-native-async-storage/async-storage';

const UPDATE_DEFERRAL_KEY = 'planetary-hours.update-deferral.v1';
const UPDATE_LAST_CHECK_KEY = 'planetary-hours.update-last-check.v1';

export async function readUpdateDeferralTimestamp(): Promise<string | null> {
  return AsyncStorage.getItem(UPDATE_DEFERRAL_KEY);
}

export async function saveUpdateDeferralTimestamp(timestamp: string) {
  await AsyncStorage.setItem(UPDATE_DEFERRAL_KEY, timestamp);
}

export async function readLastUpdateCheckTimestamp(): Promise<string | null> {
  return AsyncStorage.getItem(UPDATE_LAST_CHECK_KEY);
}

export async function saveLastUpdateCheckTimestamp(timestamp: string) {
  await AsyncStorage.setItem(UPDATE_LAST_CHECK_KEY, timestamp);
}

export function isDeferredUntilNextLocalDay(input: {
  deferredAt: string | null;
  now: Date;
}) {
  if (!input.deferredAt) {
    return false;
  }

  const deferredDate = new Date(input.deferredAt);

  if (Number.isNaN(deferredDate.getTime())) {
    return false;
  }

  return toLocalDateKey(deferredDate) === toLocalDateKey(input.now);
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
