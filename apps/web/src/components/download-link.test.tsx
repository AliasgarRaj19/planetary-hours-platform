import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';
import { Header } from './Header';

vi.mock('../hooks/useAndroidDownloadAction', () => ({
  useAndroidDownloadAction: () => ({
    label: 'Get it on Google Play',
    url: 'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
    source: 'runtime',
  }),
}));

describe('runtime download links', () => {
  it('renders the Header download action from runtime distribution data', () => {
    render(
      <Header
        dateTimeLabel="Monday, July 20, 2026 - 12:00 PM UTC"
        location={null}
        onSelectLocation={() => undefined}
        openLocationSelector={false}
      />,
    );

    expect(screen.getByRole('link', { name: 'Download the Planetary Hours Android app' })).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
    );
    expect(screen.getByText('Get it on Google Play')).toBeInTheDocument();
  });

  it('renders the Footer Downloads link from runtime distribution data', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'Downloads' })).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
    );
  });
});
