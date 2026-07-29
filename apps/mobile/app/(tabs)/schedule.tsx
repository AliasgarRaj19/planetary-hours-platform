import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PlanetaryHourWithContent } from '@/features/planetary/planetary-content';
import {
  formatCoordinate,
  formatDate,
  formatTime,
  offsetLocalDate,
  usePlanetary,
} from '@/features/planetary/planetary-state';

export default function ScheduleScreen() {
  const planetary = usePlanetary();
  const [selectedDate, setSelectedDate] = useState(() => planetary.currentDate);
  const selectedSchedule = useMemo(
    () => planetary.getScheduleForDate(selectedDate),
    [planetary, selectedDate],
  );
  const isSelectedToday = isSameLocalDate(selectedDate, planetary.currentDate);

  useEffect(() => {
    planetary.ensureContentForDate(selectedDate);
  }, [planetary, selectedDate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>
          <Text style={styles.subtitle}>{formatDate(selectedDate, planetary.timezone)}</Text>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationCopy}>
            <Text style={styles.kicker}>Selected Location</Text>
            <Text style={styles.locationName}>{planetary.locationDisplayName}</Text>
            {planetary.coordinates ? (
              <Text style={styles.locationMeta}>
                Lat {formatCoordinate(planetary.coordinates.latitude)}  Lon{' '}
                {formatCoordinate(planetary.coordinates.longitude)}
              </Text>
            ) : (
              <Text style={styles.locationMeta}>Approximate 6:00 AM to 6:00 PM window</Text>
            )}
            <Text style={styles.locationStatus}>{planetary.locationStatus}</Text>
          </View>
        </View>

        <View style={styles.dateControls}>
          <Pressable
            onPress={() => setSelectedDate((current) => offsetLocalDate(current, -1))}
            style={styles.dateButton}>
            <Text style={styles.dateButtonText}>Previous</Text>
          </Pressable>
          <Pressable
            disabled={isSelectedToday}
            onPress={() => setSelectedDate(planetary.currentDate)}
            style={[styles.dateButton, isSelectedToday && styles.dateButtonDisabled]}>
            <Text style={styles.dateButtonText}>Today</Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedDate((current) => offsetLocalDate(current, 1))}
            style={styles.dateButton}>
            <Text style={styles.dateButtonText}>Next</Text>
          </Pressable>
        </View>

        {selectedSchedule ? (
          <>
            {planetary.hourContentStatus === 'loading' ? (
              <Text style={styles.contentStatus}>Loading descriptions and suggestions...</Text>
            ) : null}
            {planetary.hourContentStatus === 'unavailable' ? (
              <Text style={styles.contentStatus}>
                Descriptions and suggestions are unavailable offline.
              </Text>
            ) : null}
            <ScheduleSection
              activeHour={planetary.activeHour}
              hours={selectedSchedule.daylight.hours}
              subtitle={`${formatTime(
                selectedSchedule.daylight.sunrise,
                planetary.timezone,
              )} - ${formatTime(selectedSchedule.daylight.sunset, planetary.timezone)}`}
              timezone={planetary.timezone}
              title="Daytime Planetary Hours"
            />
            <ScheduleSection
              activeHour={planetary.activeHour}
              hours={selectedSchedule.night.hours}
              subtitle={`${formatTime(
                selectedSchedule.night.sunset,
                planetary.timezone,
              )} - ${formatTime(selectedSchedule.night.sunrise, planetary.timezone)}`}
              timezone={planetary.timezone}
              title="Nighttime Planetary Hours"
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Planetary hour data unavailable</Text>
            <Text style={styles.emptyText}>Try another date or location.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ScheduleSection({
  activeHour,
  hours,
  subtitle,
  timezone,
  title,
}: {
  activeHour: PlanetaryHourWithContent | null;
  hours: PlanetaryHourWithContent[];
  subtitle: string;
  timezone: string;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {hours.map((hour) => {
        const isActive =
          activeHour?.startTime.getTime() === hour.startTime.getTime() &&
          activeHour.endTime.getTime() === hour.endTime.getTime();

        return (
          <View key={`${hour.hour}-${hour.startTime.toISOString()}`} style={styles.rowWrap}>
            <View style={[styles.scheduleRow, isActive && styles.activeRow]}>
              <View style={styles.hourBadge}>
                <Text style={styles.hourBadgeText}>{hour.hour}</Text>
              </View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowPlanet}>{hour.planet}</Text>
                <Text style={styles.rowTime}>
                  {formatTime(hour.startTime, timezone)} - {formatTime(hour.endTime, timezone)}
                </Text>
                {hour.description ? (
                  <Text style={styles.rowContent}>{hour.description}</Text>
                ) : null}
                {hour.suggestion ? (
                  <Text style={styles.rowContent}>{hour.suggestion}</Text>
                ) : null}
              </View>
              {isActive ? <Text style={styles.activeLabel}>Now</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function isSameLocalDate(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
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
    gap: 6,
    paddingTop: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: '#c8d5e6',
    fontSize: 15,
    lineHeight: 22,
  },
  locationCard: {
    borderWidth: 1,
    borderColor: 'rgba(246, 196, 111, 0.42)',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
  },
  locationCopy: {
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
  dateControls: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f6c46f',
    paddingVertical: 12,
  },
  dateButtonDisabled: {
    opacity: 0.48,
  },
  dateButtonText: {
    color: '#101820',
    fontSize: 13,
    fontWeight: '900',
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    gap: 3,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#c8d5e6',
    fontSize: 14,
  },
  rowWrap: {
    borderRadius: 12,
  },
  scheduleRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
  },
  activeRow: {
    borderColor: 'rgba(246, 196, 111, 0.82)',
    backgroundColor: 'rgba(246, 196, 111, 0.14)',
  },
  hourBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: 'rgba(246, 196, 111, 0.16)',
  },
  hourBadgeText: {
    color: '#f6c46f',
    fontWeight: '900',
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowPlanet: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  rowTime: {
    color: '#c8d5e6',
    fontSize: 14,
  },
  rowContent: {
    color: '#dbe7f5',
    fontSize: 13,
    lineHeight: 18,
  },
  contentStatus: {
    color: '#c8d5e6',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  activeLabel: {
    color: '#f6c46f',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyState: {
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    padding: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: '#c8d5e6',
    fontSize: 14,
  },
});
