import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePlanetary, type CitySearchResult } from './planetary-state';

export function LocationSelectorModal() {
  const {
    closeLocationSelector,
    isLoadingLocation,
    isLocationSelectorOpen,
    searchCities,
    selectDeviceLocation,
    selectManualLocation,
  } = usePlanetary();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [status, setStatus] = useState('Use device location or search for a city.');

  useEffect(() => {
    let isCurrent = true;

    if (!isLocationSelectorOpen || query.trim().length < 2) {
      setResults([]);
      setStatus('Type at least 2 characters to search cities.');
      return;
    }

    setStatus('Searching...');
    const timerId = setTimeout(async () => {
      try {
        const nextResults = await searchCities(query);

        if (!isCurrent) {
          return;
        }

        setResults(nextResults);
        setStatus(nextResults.length ? 'Select a location.' : 'No locations found.');
      } catch {
        if (isCurrent) {
          setResults([]);
          setStatus('Location search is unavailable.');
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timerId);
    };
  }, [isLocationSelectorOpen, query, searchCities]);

  return (
    <Modal animationType="slide" onRequestClose={closeLocationSelector} transparent visible={isLocationSelectorOpen}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Change Location</Text>
            <Pressable onPress={closeLocationSelector}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <Pressable
            disabled={isLoadingLocation}
            onPress={() => selectDeviceLocation(true)}
            style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>
              {isLoadingLocation ? 'Finding Location...' : 'Use Device Location'}
            </Text>
          </Pressable>
          <TextInput
            onChangeText={setQuery}
            placeholder="Search city"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            value={query}
          />
          <Text style={styles.status}>{status}</Text>
          <ScrollView style={styles.results}>
            {results.map((result) => (
              <Pressable
                key={result.id}
                onPress={() => selectManualLocation(result)}
                style={styles.result}>
                <Text style={styles.resultTitle}>{result.displayName}</Text>
                <Text style={styles.resultMeta}>{result.timezone}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  sheet: {
    maxHeight: '84%',
    gap: 14,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#07111f',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  close: {
    color: '#f6c46f',
    fontWeight: '800',
  },
  primaryAction: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f6c46f',
    padding: 14,
  },
  primaryActionText: {
    color: '#101820',
    fontWeight: '800',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 12,
    color: '#ffffff',
    padding: 14,
  },
  status: {
    color: '#c8d5e6',
  },
  results: {
    maxHeight: 320,
  },
  result: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
  },
  resultTitle: {
    color: '#ffffff',
    fontWeight: '800',
  },
  resultMeta: {
    color: '#94a3b8',
  },
});
