import { describe, expect, it } from 'vitest';

import {
  PRODUCTION_WEBSITE_URL,
  SUPPORT_EMAIL,
  legalPages,
  settingsLegalMenuItems,
} from './legal-content';

describe('legal mobile content', () => {
  it('defines the approved public pages and settings menu routes', () => {
    expect(Object.keys(legalPages).sort()).toEqual([
      'about',
      'contact',
      'disclaimer',
      'privacy',
      'terms',
    ]);

    expect(settingsLegalMenuItems.map((item) => item.title)).toEqual([
      'About Planetary Hours',
      'Privacy Policy',
      'Disclaimer',
      'Terms of Use',
      'Contact Us',
    ]);

    expect(settingsLegalMenuItems.map((item) => item.href)).toEqual([
      '/settings/about',
      '/settings/privacy-policy',
      '/settings/disclaimer',
      '/settings/terms',
      '/settings/contact',
    ]);
  });

  it('uses the production website and current support email', () => {
    expect(PRODUCTION_WEBSITE_URL).toBe('https://planetaryhours.in');
    expect(SUPPORT_EMAIL).toBe('aliasgerraj7@gmail.com');
    expect(legalPages.contact.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Support Email',
        }),
      ]),
    );
  });

  it('does not include unfinished copy or the previous staging domain', () => {
    const content = JSON.stringify({ legalPages, settingsLegalMenuItems });
    const unfinishedText = ['available', 'soon'].join(' ');
    const previousDomain = ['planetaryhours', 'signalgrowth', 'in'].join('.');

    expect(content).not.toContain(unfinishedText);
    expect(content).not.toContain(['place', 'holder'].join(''));
    expect(content).not.toContain(previousDomain);
  });

  it('maps mobile legal pages to the matching production website paths', () => {
    expect(legalPages.about.websitePath).toBe('/about');
    expect(legalPages.privacy.websitePath).toBe('/privacy');
    expect(legalPages.disclaimer.websitePath).toBe('/disclaimer');
    expect(legalPages.terms.websitePath).toBe('/terms');
    expect(legalPages.contact.websitePath).toBe('/contact');
  });
});
