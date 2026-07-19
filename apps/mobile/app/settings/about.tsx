import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsSection, settingsStyles } from '@/features/settings/settings-ui';

export default function AboutSettingsScreen() {
  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>About Planetary Hours</Text>
          <Text style={settingsStyles.subtitle}>App information and project details.</Text>
        </View>

        <SettingsSection title="About">
          <View style={{ padding: 16 }}>
            <Text style={settingsStyles.bodyText}>About Planetary Hours will be available soon.</Text>
          </View>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
