import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SettingsSection,
  SettingsValueRow,
  settingsStyles,
} from '@/features/settings/settings-ui';
import { useUpdatesState } from '@/features/updates/update-state';

export default function AppUpdatesScreen() {
  const updates = useUpdatesState();
  const androidUpdate = updates.availableAndroidUpdate;

  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>App Updates</Text>
          <Text style={settingsStyles.subtitle}>Check for compatible app updates.</Text>
        </View>

        <SettingsSection title="Updates">
          <SettingsValueRow label="App version" value={updates.appVersionLabel} />
          <SettingsValueRow label="Build number" value={updates.buildNumberLabel} />
          <SettingsValueRow label="Current update status" value={updates.currentStatus} />
          <SettingsValueRow label="Last checked" value={updates.lastCheckLabel} />
          {androidUpdate ? (
            <>
              <SettingsValueRow label="Latest version" value={androidUpdate.version} />
              <SettingsValueRow
                label="Published"
                value={formatPublishedDate(androidUpdate.publishedAt)}
              />
              <SettingsValueRow
                label="Release notes"
                value={
                  androidUpdate.releaseNotes.length
                    ? androidUpdate.releaseNotes.join('\n')
                    : 'No release notes provided.'
                }
              />
            </>
          ) : null}
          <Pressable
            accessibilityLabel={
              androidUpdate ? 'Download available Android update' : 'Check for app updates'
            }
            accessibilityRole="button"
            disabled={updates.isChecking || updates.isDownloading}
            onPress={
              androidUpdate
                ? updates.installAvailableAndroidUpdate
                : updates.checkForUpdates
            }
            style={[
              settingsStyles.primaryAction,
              (updates.isChecking || updates.isDownloading) && settingsStyles.primaryActionDisabled,
            ]}>
            <Ionicons color="#101820" name="cloud-download-outline" size={18} />
            <Text style={settingsStyles.primaryActionText}>
              {updates.isDownloading
                ? 'Downloading update...'
                : updates.isChecking
                  ? 'Checking...'
                  : androidUpdate
                    ? 'Update Now'
                    : 'Check for updates'}
            </Text>
          </Pressable>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatPublishedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
