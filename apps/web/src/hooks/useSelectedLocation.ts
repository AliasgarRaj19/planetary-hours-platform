import { useEffect, useState } from 'react';
import {
  getBrowserPosition,
  reverseGeocodeCoordinates,
  type SelectedLocation,
} from '../services/locationService';

export function useSelectedLocation() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [openLocationSelector, setOpenLocationSelector] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function requestLocation() {
      try {
        const coordinates = await getBrowserPosition();
        const location = await reverseGeocodeCoordinates(coordinates);

        if (!isMounted) {
          return;
        }

        setSelectedLocation(location);
        setOpenLocationSelector(false);
      } catch {
        if (!isMounted) {
          return;
        }

        setOpenLocationSelector(true);
      }
    }

    requestLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleLocationSelected(location: SelectedLocation) {
    setSelectedLocation(location);
    setOpenLocationSelector(false);
  }

  return {
    selectedLocation,
    openLocationSelector,
    handleLocationSelected,
  };
}
