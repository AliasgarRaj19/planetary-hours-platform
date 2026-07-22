import AsyncStorage from '@react-native-async-storage/async-storage';

const UPDATE_DEFERRAL_KEY = 'planetary-hours.update-deferral.v1';
const UPDATE_LAST_CHECK_KEY = 'planetary-hours.update-last-check.v1';
const UPDATE_IGNORED_NATIVE_BUILD_KEY = 'planetary-hours.update-ignored-native-build.v1';

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

export async function readIgnoredNativeUpdateBuild(): Promise<number | null> {
  const storedBuild = await AsyncStorage.getItem(UPDATE_IGNORED_NATIVE_BUILD_KEY);

  if (!storedBuild) {
    return null;
  }

  const parsedBuild = Number.parseInt(storedBuild, 10);
  return Number.isFinite(parsedBuild) ? parsedBuild : null;
}

export async function saveIgnoredNativeUpdateBuild(build: number) {
  await AsyncStorage.setItem(UPDATE_IGNORED_NATIVE_BUILD_KEY, String(build));
}

export async function clearIgnoredNativeUpdateBuild() {
  await AsyncStorage.removeItem(UPDATE_IGNORED_NATIVE_BUILD_KEY);
}

export function shouldSuppressIgnoredNativeUpdate(input: {
  ignoredBuild: number | null;
  installedBuild: number;
  latestBuild: number;
}) {
  if (input.ignoredBuild === null || input.installedBuild >= input.ignoredBuild) {
    return false;
  }

  return input.latestBuild === input.ignoredBuild;
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
