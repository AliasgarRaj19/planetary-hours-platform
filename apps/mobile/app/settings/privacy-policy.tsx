import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsSection, settingsStyles } from '@/features/settings/settings-ui';

export default function PrivacyPolicySettingsScreen() {
  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>Privacy Policy</Text>
          <Text style={settingsStyles.subtitle}>Privacy information for Planetary Hours.</Text>
        </View>

        <SettingsSection title="Privacy Policy">
          <View style={{ padding: 16 }}>
            <Text style={settingsStyles.bodyText}>Privacy Policy will be available soon.</Text>
          </View>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
