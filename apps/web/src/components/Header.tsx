import { LocationSelector } from './LocationSelector';
import { useAndroidDownloadAction } from '../hooks/useAndroidDownloadAction';
import type { SelectedLocation } from '../services/locationService';

type HeaderProps = {
  dateTimeLabel: string;
  location: SelectedLocation | null;
  onSelectLocation: (location: SelectedLocation) => void;
  openLocationSelector: boolean;
  renderBrandHeading?: boolean;
};

export function Header({
  dateTimeLabel,
  location,
  onSelectLocation,
  openLocationSelector,
  renderBrandHeading = true,
}: HeaderProps) {
  const downloadAction = useAndroidDownloadAction();
  const brandTitle = renderBrandHeading ? (
    <h1>Planetary Hours</h1>
  ) : (
    <p className="site-title">Planetary Hours</p>
  );

  return (
    <header className="site-header">
      <div>
        <a className="site-identity-link" href="/" aria-label="Planetary Hours home">
          <p className="eyebrow">Daily celestial rhythm</p>
          {brandTitle}
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
          {downloadAction.url ? (
            <a
              aria-label="Download the Planetary Hours Android app"
              className="header-download-link"
              href={downloadAction.url}
              rel="noopener noreferrer">
              <span aria-hidden="true">APK</span>
              {downloadAction.label}
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
