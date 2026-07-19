import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationSelectorModal } from '@/features/planetary/location-selector-modal';
import {
  formatCoordinate,
  usePlanetary,
} from '@/features/planetary/planetary-state';
import {
  formatLocationMode,
  SettingsSection,
  SettingsValueRow,
  settingsStyles,
} from '@/features/settings/settings-ui';

export default function LocationSettingsScreen() {
  const planetary = usePlanetary();

  return (
    <SafeAreaView style={settingsStyles.safeArea}>
      <ScrollView contentContainerStyle={settingsStyles.container}>
        <View style={settingsStyles.header}>
          <Text style={settingsStyles.title}>Location</Text>
          <Text style={settingsStyles.subtitle}>Review or change the selected location mode.</Text>
        </View>

        <SettingsSection title="Current Location">
          <SettingsValueRow label="Mode" value={formatLocationMode(planetary.locationMode)} />
          <SettingsValueRow label="Location" value={planetary.locationDisplayName} />
          <SettingsValueRow label="Status" value={planetary.locationStatus} />
          <SettingsValueRow label="Timezone" value={planetary.timezone} />
          {planetary.coordinates ? (
            <SettingsValueRow
              label="Coordinates"
              value={`${formatCoordinate(planetary.coordinates.latitude)}, ${formatCoordinate(
                planetary.coordinates.longitude,
              )}`}
            />
          ) : null}
          {planetary.errorMessage ? (
            <SettingsValueRow label="Message" value={planetary.errorMessage} />
          ) : null}
          <Pressable
            accessibilityLabel="Change location"
            accessibilityRole="button"
            disabled={planetary.isLoadingLocation}
            onPress={planetary.openLocationSelector}
            style={[
              settingsStyles.primaryAction,
              planetary.isLoadingLocation && settingsStyles.primaryActionDisabled,
            ]}>
            <Ionicons color="#101820" name="location-outline" size={18} />
            <Text style={settingsStyles.primaryActionText}>
              {planetary.isLoadingLocation ? 'Getting your location...' : 'Change Location'}
            </Text>
          </Pressable>
        </SettingsSection>
      </ScrollView>
      <LocationSelectorModal />
    </SafeAreaView>
  );
}
