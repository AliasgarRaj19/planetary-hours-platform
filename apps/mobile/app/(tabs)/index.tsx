import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PlanetaryHourScheduleRow } from '@planetary-hours/planetary-engine';
import { LocationSelectorModal } from '@/features/planetary/location-selector-modal';
import {
  formatCoordinate,
  formatTime,
  offsetLocalDate,
  usePlanetary,
  type PlanetaryDaySchedule,
} from '@/features/planetary/planetary-state';

const PLANET_SYMBOLS: Record<PlanetaryHourScheduleRow['planet'], string> = {
  Jupiter: '♃',
  Mars: '♂',
  Mercury: '☿',
  Moon: '☾',
  Saturn: '♄',
  Sun: '☉',
  Venus: '♀',
};

export default function HomeScreen() {
  const planetary = usePlanetary();
  const windowInfo = getWindowInfo({
    now: planetary.now,
    schedule: planetary.currentSchedule,
    timezone: planetary.timezone,
    previousSchedule: planetary.getScheduleForDate(offsetLocalDate(planetary.currentDate, -1)),
    tomorrowSchedule: planetary.getScheduleForDate(offsetLocalDate(planetary.currentDate, 1)),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Planetary Hours</Text>
          <Text style={styles.subtitle}>
            Calculate the planetary ruler for the current hour
          </Text>
        </View>

        <Pressable onPress={planetary.openLocationSelector} style={styles.locationCard}>
          <View style={styles.locationCopy}>
            <Text style={styles.kicker}>Location</Text>
            <Text style={styles.locationName}>{planetary.locationDisplayName}</Text>
            {planetary.coordinates ? (
              <Text style={styles.locationMeta}>
                Lat {formatCoordinate(planetary.coordinates.latitude)}  Lon{' '}
                {formatCoordinate(planetary.coordinates.longitude)}
              </Text>
            ) : (
              <Text style={styles.locationMeta}>6:00 AM sunrise, 6:00 PM sunset fallback</Text>
            )}
            <Text style={styles.locationStatus}>{planetary.locationStatus}</Text>
          </View>
          <View style={styles.locationAction}>
            <Text style={styles.changeText}>Change</Text>
            <Ionicons color="#f6c46f" name="chevron-down" size={18} />
          </View>
        </Pressable>

        {planetary.errorMessage ? (
          <Text style={styles.errorText}>{planetary.errorMessage}</Text>
        ) : null}

        <View style={styles.summaryGrid}>
          <PlanetaryCard
            hour={planetary.activeHour}
            label="Current Planetary Hour"
            loading={planetary.isLoadingLocation}
            timezone={planetary.timezone}
          />
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Time Remaining</Text>
            <Text style={styles.countdown}>{planetary.countdownLabel}</Text>
            <Text style={styles.cardMeta}>Updates live from the active hour end time</Text>
          </View>
          <PlanetaryCard
            hour={planetary.nextHour}
            label="Next Planetary Hour"
            loading={planetary.isLoadingLocation}
            timezone={planetary.timezone}
          />
        </View>

        <View style={styles.windowCard}>
          <Text style={styles.windowTitle}>{windowInfo.title}</Text>
          <View style={styles.windowRow}>
            <View style={styles.windowMetric}>
              <Text style={styles.windowLabel}>{windowInfo.firstLabel}</Text>
              <Text style={styles.windowTime}>{windowInfo.firstTime}</Text>
            </View>
            <View style={styles.windowMetric}>
              <Text style={styles.windowLabel}>{windowInfo.secondLabel}</Text>
              <Text style={styles.windowTime}>{windowInfo.secondTime}</Text>
            </View>
          </View>
          <Text style={styles.windowStatus}>{windowInfo.status}</Text>
        </View>
      </ScrollView>
      <LocationSelectorModal />
    </SafeAreaView>
  );
}

function PlanetaryCard({
  hour,
  label,
  loading,
  timezone,
}: {
  hour: PlanetaryHourScheduleRow | null;
  label: string;
  loading: boolean;
  timezone: string;
}) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardPlanet}>Loading</Text>
        <Text style={styles.cardMeta}>Refreshing planetary hour data</Text>
      </View>
    );
  }

  if (!hour) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardPlanet}>Unavailable</Text>
        <Text style={styles.cardMeta}>Planetary hour data unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.planetRow}>
        <Text style={styles.planetSymbol}>{PLANET_SYMBOLS[hour.planet]}</Text>
        <Text style={styles.cardPlanet}>{hour.planet}</Text>
      </View>
      <Text style={styles.hourLabel}>Hour {hour.hour}</Text>
      <Text style={styles.cardMeta}>
        {formatTime(hour.startTime, timezone)} - {formatTime(hour.endTime, timezone)}
      </Text>
    </View>
  );
}

function getWindowInfo(input: {
  now: Date;
  previousSchedule: PlanetaryDaySchedule | null;
  schedule: PlanetaryDaySchedule | null;
  timezone: string;
  tomorrowSchedule: PlanetaryDaySchedule | null;
}) {
  if (!input.schedule) {
    return {
      firstLabel: 'Sunrise',
      firstTime: '--',
      secondLabel: 'Sunset',
      secondTime: '--',
      status: 'Planetary hour data unavailable',
      title: 'Daylight Window',
    };
  }

  const isDaytime =
    input.now >= input.schedule.daylight.sunrise && input.now < input.schedule.daylight.sunset;

  if (isDaytime) {
    return {
      firstLabel: 'Sunrise',
      firstTime: formatTime(input.schedule.daylight.sunrise, input.timezone),
      secondLabel: 'Sunset',
      secondTime: formatTime(input.schedule.daylight.sunset, input.timezone),
      status: 'Daytime planetary hours active',
      title: 'Daylight Window',
    };
  }

  const isBeforeSunrise = input.now < input.schedule.daylight.sunrise;
  const previousSunset =
    input.previousSchedule?.night.sunset ?? input.schedule.daylight.sunset;
  const nextSunrise = isBeforeSunrise
    ? input.schedule.daylight.sunrise
    : input.tomorrowSchedule?.daylight.sunrise ?? input.schedule.night.sunrise;
  const currentSunset = isBeforeSunrise ? previousSunset : input.schedule.night.sunset;

  return {
    firstLabel: isBeforeSunrise ? 'Previous Sunset' : 'Sunset',
    firstTime: formatTime(currentSunset, input.timezone),
    secondLabel: 'Next Sunrise',
    secondTime: formatTime(nextSunrise, input.timezone),
    status: 'Nighttime planetary hours active',
    title: 'Night Window',
  };
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07111f',
  },
  container: {
    gap: 18,
    padding: 20,
    paddingBottom: 34,
  },
  header: {
    gap: 8,
    paddingTop: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#c8d5e6',
    fontSize: 16,
    lineHeight: 23,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(246, 196, 111, 0.42)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    color: '#f6c46f',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  locationName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  locationMeta: {
    color: '#c8d5e6',
    fontSize: 13,
    lineHeight: 18,
  },
  locationStatus: {
    color: '#f6c46f',
    fontSize: 13,
    fontWeight: '700',
  },
  locationAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  changeText: {
    color: '#f6c46f',
    fontSize: 13,
    fontWeight: '800',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
  },
  summaryGrid: {
    gap: 12,
  },
  card: {
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  cardLabel: {
    color: '#f6c46f',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  planetRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  planetSymbol: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
  },
  cardPlanet: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  hourLabel: {
    color: '#f6c46f',
    fontSize: 15,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#c8d5e6',
    fontSize: 14,
    lineHeight: 20,
  },
  countdown: {
    color: '#ffffff',
    fontSize: 34,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
  },
  windowCard: {
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  windowTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  windowRow: {
    flexDirection: 'row',
    gap: 10,
  },
  windowMetric: {
    flex: 1,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(246, 196, 111, 0.26)',
    borderRadius: 12,
    padding: 12,
  },
  windowLabel: {
    color: '#f6c46f',
    fontSize: 12,
    fontWeight: '800',
  },
  windowTime: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  windowStatus: {
    color: '#c8d5e6',
    fontSize: 14,
    fontWeight: '700',
  },
});
