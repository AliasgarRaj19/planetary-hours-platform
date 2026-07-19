import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsSection, settingsStyles } from '@/features/settings/settings-ui';

export default function TimeFormatSettingsScreen() {
  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>Time Format</Text>
          <Text style={settingsStyles.subtitle}>Choose how times are shown in the app.</Text>
        </View>

        <SettingsSection title="Time Format">
          <View style={{ padding: 16 }}>
            <Text style={settingsStyles.bodyText}>
              Time format settings will be available soon.
            </Text>
          </View>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
