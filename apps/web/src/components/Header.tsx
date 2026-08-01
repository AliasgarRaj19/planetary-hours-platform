import { LocationSelector } from './LocationSelector';
import { getAndroidApkUrl } from '../config/androidRelease';
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
  const apkUrl = getAndroidApkUrl();

  return (
    <header className="site-header">
      <div>
        <a className="site-identity-link" href="/" aria-label="Planetary Hours home">
          <p className="eyebrow">Daily celestial rhythm</p>
          <h1>Planetary Hours</h1>
        </a>
        <nav className="header-nav" aria-label="Primary navigation">
          <a className="schedule-nav-link" href="/schedule">
            <span aria-hidden="true">☷</span>
            Schedule Table
          </a>
        </nav>
      </div>
      <div className="header-meta" aria-label="Current context">
        <div className="header-location-stack">
          {apkUrl ? (
            <a
              aria-label="Download the Planetary Hours Android app"
              className="header-download-link"
              href={apkUrl}
              rel="noopener noreferrer">
              <span aria-hidden="true">APK</span>
              Download the app
            </a>
          ) : null}
          <LocationSelector
            location={location}
            onSelectLocation={onSelectLocation}
            openOnMount={openLocationSelector}
          />
        </div>
        <span>{dateTimeLabel}</span>
      </div>
    </header>
  );
}
