import { render, screen } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Footer } from './Footer';
import { Header } from './Header';

const publishedCategories = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  name: `Category ${index + 1}`,
  slug: `category-${index + 1}`,
  description: '',
  seoTitle: null,
  seoDescription: null,
  createdAt: '2026-08-06T00:00:00.000Z',
  updatedAt: '2026-08-06T00:00:00.000Z',
}));

vi.mock('../hooks/useAndroidDownloadAction', () => ({
  useAndroidDownloadAction: () => ({
    label: 'Get it on Google Play',
    url: 'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
    source: 'runtime',
  }),
}));

vi.mock('../api/blog', () => ({
  getPublishedCategories: () => Promise.resolve(publishedCategories),
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

  it('renders the redesigned footer columns and bottom branding', async () => {
    render(<Footer />);

    expect(screen.getByRole('navigation', { name: 'Quick Links' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Company' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Planetary Hour Blog' })).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === 'Designed & Developed by Aliasgar Raj • Signal Growth',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('© 2026 Signal Growth. All Rights Reserved.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Category 1' })).toHaveAttribute(
        'href',
        '/blog?category=category-1',
      );
    });
  });

  it('limits dynamic footer categories to six published categories', async () => {
    render(<Footer />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Category 6' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('link', { name: 'Category 7' })).not.toBeInTheDocument();
  });
});
