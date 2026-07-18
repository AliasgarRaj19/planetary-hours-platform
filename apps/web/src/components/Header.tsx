import { LocationSelector } from './LocationSelector';
import type { SelectedLocation } from '../services/locationService';

type HeaderProps = {
  dateTimeLabel: string;
  location: SelectedLocation | null;
  onSelectLocation: (location: SelectedLocation) => void;
  openLocationSelector: boolean;
};

export function Header({
  dateTimeLabel,
  location,
  onSelectLocation,
  openLocationSelector,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div>
        <p className="eyebrow">Daily celestial rhythm</p>
        <h1>Planetary Hours</h1>
      </div>
      <div className="header-meta" aria-label="Current context">
        <LocationSelector
          location={location}
          onSelectLocation={onSelectLocation}
          openOnMount={openLocationSelector}
        />
        <span>{dateTimeLabel}</span>
      </div>
    </header>
  );
}
