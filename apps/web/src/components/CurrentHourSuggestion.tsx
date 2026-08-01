import type { WebsitePlanetaryHourRow } from '../types/planetaryHoursContent';

type CurrentHourSuggestionProps = {
  currentHour: WebsitePlanetaryHourRow | null;
  isLoading: boolean;
  hasError: boolean;
};

export function CurrentHourSuggestion({
  currentHour,
  isLoading,
  hasError,
}: CurrentHourSuggestionProps) {
  const suggestion = currentHour?.suggestion?.trim();

  return (
    <section className="suggestion-card" aria-labelledby="current-hour-suggestion-title">
      <p className="eyebrow">Active Guidance</p>
      <h2 id="current-hour-suggestion-title">Current Hour Suggestion</h2>
      <p>
        {hasError
          ? 'Suggestion unavailable right now.'
          : isLoading
            ? 'Loading suggestion...'
            : suggestion || 'No suggestion has been added for the current hour yet.'}
      </p>
    </section>
  );
}
