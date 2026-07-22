import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatLocationMode,
  SettingsBrandingFooter,
  SettingsMenuRow,
  SettingsSection,
  settingsStyles,
} from '@/features/settings/settings-ui';
import { usePlanetary } from '@/features/planetary/planetary-state';
import { useUpdatesState } from '@/features/updates/update-state';

export default function SettingsScreen() {
  const planetary = usePlanetary();
  const router = useRouter();
  const updates = useUpdatesState();

  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>Settings</Text>
          <Text style={settingsStyles.subtitle}>Manage app options and information</Text>
        </View>

        <SettingsSection title="Updates">
          <SettingsMenuRow
            accessibilityLabel="Open app updates settings"
            onPress={() => router.push('/settings/app-updates')}
            subtitle={updates.currentStatus || updates.appVersionLabel}
            title="App updates"
          />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsMenuRow
            accessibilityLabel="Open location settings"
            onPress={() => router.push('/settings/location')}
            subtitle={formatLocationMode(planetary.locationMode)}
            title="Location"
          />
          <SettingsMenuRow
            accessibilityLabel="Open time format settings"
            onPress={() => router.push('/settings/time-format')}
            subtitle="Coming soon"
            title="Time format"
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsMenuRow
            accessibilityLabel="Open About Planetary Hours"
            onPress={() => router.push('/settings/about')}
            title="About Planetary Hours"
          />
          <SettingsMenuRow
            accessibilityLabel="Open Privacy Policy"
            onPress={() => router.push('/settings/privacy-policy')}
            title="Privacy Policy"
          />
          <SettingsMenuRow
            accessibilityLabel="Open Disclaimer"
            onPress={() => router.push('/settings/disclaimer')}
            title="Disclaimer"
          />
        </SettingsSection>

        <SettingsBrandingFooter />
      </ScrollView>
    </SafeAreaView>
  );
}
