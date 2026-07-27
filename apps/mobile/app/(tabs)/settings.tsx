import { type Href, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  formatLocationMode,
  SettingsBrandingFooter,
  SettingsMenuRow,
  SettingsSection,
  settingsStyles,
} from '@/features/settings/settings-ui';
import { settingsLegalMenuItems } from '@/features/legal/legal-content';
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
          {settingsLegalMenuItems.map((item) => (
            <SettingsMenuRow
              accessibilityLabel={item.accessibilityLabel}
              key={item.title}
              onPress={() => router.push(item.href as Href)}
              title={item.title}
            />
          ))}
        </SettingsSection>

        <SettingsBrandingFooter />
      </ScrollView>
    </SafeAreaView>
  );
}
