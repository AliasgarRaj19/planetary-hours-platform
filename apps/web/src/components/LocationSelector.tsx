import { useEffect, useRef, useState } from 'react';
import {
  searchCities,
  type CitySearchResult,
  type SelectedLocation,
} from '../services/locationService';

type LocationSelectorProps = {
  location: SelectedLocation | null;
  onSelectLocation: (location: SelectedLocation) => void;
  openOnMount: boolean;
};

export function LocationSelector({
  location,
  onSelectLocation,
  openOnMount,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(openOnMount);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [status, setStatus] = useState('Type a city name');
  const [isSearching, setIsSearching] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openOnMount) {
      setIsOpen(true);
    }
  }, [openOnMount]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!isOpen || trimmedQuery.length < 2) {
      setResults([]);
      setStatus('Type at least 2 characters');
      setIsSearching(false);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);
    setStatus('Searching...');

    const timerId = window.setTimeout(async () => {
      try {
        const cities = await searchCities(trimmedQuery);

        if (!isCurrent) {
          return;
        }

        setResults(cities);
        setStatus(cities.length ? 'Select a location' : 'No locations found');
      } catch {
        if (!isCurrent) {
          return;
        }

        setResults([]);
        setStatus('Location search is unavailable');
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      isCurrent = false;
      window.clearTimeout(timerId);
    };
  }, [isOpen, query]);

  function handleSelect(result: CitySearchResult) {
    onSelectLocation({
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
      displayName: result.displayName,
      city: result.city,
      state: result.state,
      country: result.country,
      source: 'manual',
    });
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div className="location-selector" ref={selectorRef}>
      <button
        type="button"
        className="location-trigger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{location?.displayName ?? 'Select your location'}</span>
        <span aria-hidden="true">▼</span>
      </button>

      {isOpen && (
        <div className="location-menu">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search city"
          />
          <p>{isSearching ? 'Searching...' : status}</p>
          {results.length > 0 && (
            <div className="location-options">
              {results.map((result) => (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => handleSelect(result)}
                >
                  <span>{result.displayName}</span>
                  <small>{result.timezone}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
