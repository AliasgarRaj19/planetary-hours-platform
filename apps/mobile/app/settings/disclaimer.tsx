import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsSection, settingsStyles } from '@/features/settings/settings-ui';

export default function DisclaimerSettingsScreen() {
  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>Disclaimer</Text>
          <Text style={settingsStyles.subtitle}>Important information about app results.</Text>
        </View>

        <SettingsSection title="Disclaimer">
          <View style={{ padding: 16 }}>
            <Text style={settingsStyles.bodyText}>
              Planetary Hours is provided for informational and personal reflection purposes. The
              app calculations should not be treated as professional, medical, legal, or
              financial advice.
            </Text>
          </View>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
