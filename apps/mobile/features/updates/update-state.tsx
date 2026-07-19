import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import {
  readLastUpdateCheckTimestamp,
  readUpdateDeferralTimestamp,
  saveLastUpdateCheckTimestamp,
  saveUpdateDeferralTimestamp,
  isDeferredUntilNextLocalDay,
} from './update-preferences';
import {
  checkHybridUpdate,
  createStartupUpdateCoordinator,
  downloadCompatibleEasUpdate,
  type HybridUpdateResult,
} from './update-service';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'up-to-date' | 'deferred' | 'error';

type UpdateState = {
  appVersionLabel: string;
  buildNumberLabel: string;
  checkForUpdates: () => Promise<void>;
  currentStatus: string;
  isChecking: boolean;
  isDownloading: boolean;
  lastCheckLabel: string;
  nativeManifestUrlLabel: string;
};

const UpdateContext = createContext<UpdateState | null>(null);
const startupUpdateCoordinator = createStartupUpdateCoordinator();

export function UpdateProvider({ children }: PropsWithChildren) {
  const [lastCheckAt, setLastCheckAt] = useState<string | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<HybridUpdateResult | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('Update status unknown');
  const mountedRef = useRef(false);
  const activeCheckId = useRef(0);

  const nativeManifestUrl = getNativeManifestUrl();
  const installedVersionCode = getInstalledVersionCode();
  const appVersion = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? 'Unknown';
  const buildNumber = Application.nativeBuildVersion ?? String(installedVersionCode);

  const checkForUpdates = useCallback(async () => {
    await runUpdateCheck({
      activeCheckId,
      installedVersionCode,
      manual: true,
      mountedRef,
      nativeManifestUrl,
      setLastCheckAt,
      setPendingUpdate,
      setStatus,
      setStatusMessage,
    });
  }, [installedVersionCode, nativeManifestUrl]);

  useEffect(() => {
    mountedRef.current = true;
    void readLastUpdateCheckTimestamp().then((timestamp) => {
      if (mountedRef.current) {
        setLastCheckAt(timestamp);
      }
    });

    return () => {
      mountedRef.current = false;
      activeCheckId.current += 1;
    };
  }, []);

  useEffect(() => {
    if (__DEV__ || !startupUpdateCoordinator.shouldStart()) {
      return;
    }

    const timerId = setTimeout(() => {
      void runStartupUpdateCheck({
        activeCheckId,
        installedVersionCode,
        mountedRef,
        nativeManifestUrl,
        setLastCheckAt,
        setPendingUpdate,
        setStatus,
        setStatusMessage,
      });
    }, 0);

    return () => clearTimeout(timerId);
  }, [installedVersionCode, nativeManifestUrl]);

  useEffect(() => {
    if (!pendingUpdate || status !== 'available') {
      return;
    }

    if (pendingUpdate.kind === 'eas') {
      Alert.alert('Update available', 'A new Planetary Hours update is ready.', [
        {
          onPress: () => {
            void deferUpdatePrompt({
              mountedRef,
              setStatus,
              setStatusMessage,
            });
          },
          text: 'Later',
        },
        {
          onPress: () => {
            void downloadEasUpdate({
              mountedRef,
              setStatus,
              setStatusMessage,
            });
          },
          text: 'Update now',
        },
      ]);
      return;
    }

    if (pendingUpdate.kind === 'native') {
      const notes = pendingUpdate.update.releaseNotes.slice(0, 3).join('\n');
      const message = [`Version ${pendingUpdate.update.latestVersion} is available.`, notes]
        .filter(Boolean)
        .join('\n\n');

      Alert.alert('New app version available', message, [
        {
          onPress: () => {
            void deferUpdatePrompt({
              mountedRef,
              setStatus,
              setStatusMessage,
            });
          },
          text: 'Later',
        },
        {
          onPress: () => {
            void Linking.openURL(pendingUpdate.update.downloadUrl);
          },
          text: 'Update now',
        },
      ]);
    }
  }, [pendingUpdate, status]);

  const value = useMemo<UpdateState>(
    () => ({
      appVersionLabel: `Version ${appVersion} (Build ${buildNumber})`,
      buildNumberLabel: buildNumber,
      checkForUpdates,
      currentStatus: statusMessage,
      isChecking: status === 'checking',
      isDownloading: status === 'downloading',
      lastCheckLabel: formatLastCheckLabel(lastCheckAt),
      nativeManifestUrlLabel: nativeManifestUrl || 'Not configured',
    }),
    [appVersion, buildNumber, checkForUpdates, lastCheckAt, nativeManifestUrl, status, statusMessage],
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdatesState() {
  const value = useContext(UpdateContext);

  if (!value) {
    throw new Error('useUpdatesState must be used inside UpdateProvider');
  }

  return value;
}

async function runStartupUpdateCheck(input: UpdateCheckInput) {
  const deferredAt = await readUpdateDeferralTimestamp();

  if (isDeferredUntilNextLocalDay({ deferredAt, now: new Date() })) {
    applyIfMounted(input.mountedRef, () => {
      input.setStatus('deferred');
      input.setStatusMessage('Update prompt deferred until tomorrow');
    });
    return;
  }

  await runUpdateCheck({
    ...input,
    manual: false,
  });
}

type UpdateCheckInput = {
  activeCheckId: { current: number };
  installedVersionCode: number;
  manual?: boolean;
  mountedRef: { current: boolean };
  nativeManifestUrl: string | null;
  setLastCheckAt: (value: string | null) => void;
  setPendingUpdate: (value: HybridUpdateResult | null) => void;
  setStatus: (value: UpdateStatus) => void;
  setStatusMessage: (value: string) => void;
};

async function runUpdateCheck(input: UpdateCheckInput) {
  const checkId = input.activeCheckId.current + 1;
  input.activeCheckId.current = checkId;
  const checkedAt = new Date().toISOString();

  applyIfCurrent(input, checkId, () => {
    input.setStatus('checking');
    input.setStatusMessage('Checking for updates...');
    input.setPendingUpdate(null);
  });
  await saveLastUpdateCheckTimestamp(checkedAt);
  applyIfCurrent(input, checkId, () => input.setLastCheckAt(checkedAt));

  try {
    const result = await checkHybridUpdate({
      canCheckEasUpdates: canUseEasUpdates(),
      checkEasUpdate: async () => {
        const update = await Updates.checkForUpdateAsync();
        return { available: update.isAvailable };
      },
      installedVersionCode: input.installedVersionCode,
      nativeManifestUrl: input.nativeManifestUrl,
    });

    applyIfCurrent(input, checkId, () => {
      input.setPendingUpdate(result);

      if (result.kind === 'native') {
        input.setStatus('available');
        input.setStatusMessage(`New app version ${result.update.latestVersion} available`);
        return;
      }

      if (result.kind === 'eas') {
        input.setStatus('available');
        input.setStatusMessage('Compatible update available');
        return;
      }

      input.setStatus('up-to-date');
      input.setStatusMessage(input.manual ? "You're up to date" : 'No update available');

      if (input.manual) {
        Alert.alert("You're up to date", 'Planetary Hours is already current.');
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to check for updates.';

    applyIfCurrent(input, checkId, () => {
      input.setStatus('error');
      input.setStatusMessage(message);

      if (input.manual) {
        Alert.alert('Update check failed', message);
      }
    });
  }
}

async function downloadEasUpdate(input: {
  mountedRef: { current: boolean };
  setStatus: (value: UpdateStatus) => void;
  setStatusMessage: (value: string) => void;
}) {
  applyIfMounted(input.mountedRef, () => {
    input.setStatus('downloading');
    input.setStatusMessage('Downloading update...');
  });

  try {
    const didReload = await downloadCompatibleEasUpdate({
      fetchUpdate: () => Updates.fetchUpdateAsync(),
      reload: () => Updates.reloadAsync(),
    });

    if (!didReload) {
      applyIfMounted(input.mountedRef, () => {
        input.setStatus('up-to-date');
        input.setStatusMessage("You're up to date");
      });
    }
  } catch {
    applyIfMounted(input.mountedRef, () => {
      input.setStatus('error');
      input.setStatusMessage('Update download failed. Please try again.');
    });
    Alert.alert('Update failed', 'The update could not be downloaded. Please try again later.');
  }
}

async function deferUpdatePrompt(input: {
  mountedRef: { current: boolean };
  setStatus: (value: UpdateStatus) => void;
  setStatusMessage: (value: string) => void;
}) {
  await saveUpdateDeferralTimestamp(new Date().toISOString());
  applyIfMounted(input.mountedRef, () => {
    input.setStatus('deferred');
    input.setStatusMessage('Update prompt deferred until tomorrow');
  });
}

function canUseEasUpdates() {
  return !__DEV__ && Updates.isEnabled;
}

function getInstalledVersionCode() {
  const nativeBuildVersion = Number.parseInt(Application.nativeBuildVersion ?? '', 10);

  if (Number.isFinite(nativeBuildVersion)) {
    return nativeBuildVersion;
  }

  const configVersionCode = Constants.expoConfig?.android?.versionCode;
  return typeof configVersionCode === 'number' ? configVersionCode : 1;
}

function getNativeManifestUrl() {
  if (Platform.OS !== 'android') {
    return null;
  }

  const url = Constants.expoConfig?.extra?.nativeUpdateManifestUrl;
  return typeof url === 'string' && url.trim() ? url.trim() : null;
}

function formatLastCheckLabel(value: string | null) {
  if (!value) {
    return 'Never';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Never';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function applyIfCurrent(input: UpdateCheckInput, checkId: number, update: () => void) {
  if (input.mountedRef.current && input.activeCheckId.current === checkId) {
    update();
  }
}

function applyIfMounted(mountedRef: { current: boolean }, update: () => void) {
  if (mountedRef.current) {
    update();
  }
}
