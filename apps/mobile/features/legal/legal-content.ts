export type LegalTextBlock = {
  type: 'paragraph';
  text: string;
};

export type LegalListBlock = {
  items: string[];
  type: 'list';
};

export type LegalSection = {
  blocks: Array<LegalTextBlock | LegalListBlock>;
  title: string;
};

export type LegalPageContent = {
  sections: LegalSection[];
  subtitle: string;
  title: string;
  websitePath: string;
};

export type LegalMenuItem = {
  accessibilityLabel: string;
  href: string;
  title: string;
};

export const SUPPORT_EMAIL = 'aliasgerraj7@gmail.com';
export const PRODUCTION_WEBSITE_URL = 'https://planetaryhours.in';

export const legalPages = {
  about: {
    title: 'About Planetary Hours',
    subtitle: 'Purpose, approach, and project information.',
    websitePath: '/about',
    sections: [
      {
        title: 'Our Story',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours was created to make the traditional system of planetary hours more accessible through modern technology.',
          },
          {
            type: 'paragraph',
            text: 'For centuries, planetary hours have been used in various astrological and spiritual traditions to identify the planetary influence associated with different times of the day and night. Performing the calculations manually can be time-consuming and, at times, confusing.',
          },
          {
            type: 'paragraph',
            text: 'Planetary Hours was developed to simplify this process while remaining respectful of the traditional methods on which these calculations are based.',
          },
        ],
      },
      {
        title: 'Our Approach',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours is built using traditional calculation methods described in authentic astrological and historical references.',
          },
          {
            type: 'paragraph',
            text: 'Different traditions, authors, and schools of practice may describe planetary hour calculations with slight variations. These differences can result in small variations of a few seconds or minutes depending on the interpretation or methodology followed.',
          },
          {
            type: 'paragraph',
            text: 'Rather than claiming absolute or universal accuracy, our goal is to implement a consistent, well-researched, and transparent approach that remains faithful to the traditional principles from which planetary hours originate.',
          },
        ],
      },
      {
        title: 'What Planetary Hours Provides',
        blocks: [
          { type: 'paragraph', text: 'Planetary Hours is designed to help users by providing:' },
          {
            type: 'list',
            items: [
              'Planetary hour calculations based on traditional methods.',
              "Calculations that adapt to the user's location and local sunrise and sunset times.",
              'A clean and easy-to-use interface.',
              'Consistent calculations using a documented methodology.',
              'Ongoing improvements based on research and user feedback.',
            ],
          },
        ],
      },
      {
        title: 'Our Mission and Vision',
        blocks: [
          {
            type: 'paragraph',
            text: 'Our mission is to preserve traditional knowledge while making it more accessible through modern technology.',
          },
          {
            type: 'paragraph',
            text: 'Over time, we hope to develop a broader collection of applications and resources that support the study and practice of traditional astrology, spirituality, and related disciplines, while maintaining quality, transparency, and continuous improvement.',
          },
        ],
      },
      {
        title: 'About Signal Growth',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours is designed, developed, and maintained by Signal Growth.',
          },
          {
            type: 'paragraph',
            text: 'Signal Growth focuses on building thoughtful digital products that combine traditional knowledge with modern software engineering.',
          },
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How Planetary Hours handles information.',
    websitePath: '/privacy',
    sections: [
      {
        title: 'Introduction',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours is designed, developed, and maintained by Signal Growth. This Privacy Policy explains how information is collected, used, stored, and protected when you use the Planetary Hours mobile application, website, and related services.',
          },
        ],
      },
      {
        title: 'Information We Collect',
        blocks: [
          {
            type: 'paragraph',
            text: "Planetary Hours may request foreground location access to calculate planetary hours according to your geographical position and local time. Location information is used for the application's core calculation features and is not sold or used for advertising.",
          },
          {
            type: 'paragraph',
            text: 'When you contact us by email or another support channel, we may collect information such as your name, email address, subject, message content, and any information you voluntarily provide.',
          },
          {
            type: 'paragraph',
            text: 'Limited technical information may be processed as part of normal internet and application operation, such as device type, operating system, application version, browser type, IP address, request timestamps, or basic server information.',
          },
        ],
      },
      {
        title: 'How We Use Information',
        blocks: [
          {
            type: 'list',
            items: [
              'Calculate planetary hours accurately.',
              "Provide and maintain the application's core functionality.",
              'Respond to inquiries and support requests.',
              'Understand reported problems.',
              'Improve usability, reliability, and security.',
              'Comply with applicable legal requirements.',
            ],
          },
          { type: 'paragraph', text: 'We do not sell personal information.' },
        ],
      },
      {
        title: 'Device Permissions',
        blocks: [
          {
            type: 'paragraph',
            text: 'The application may request foreground location permission to determine approximate or precise geographical position for planetary hour calculations. Users may deny or revoke location permission through device settings.',
          },
          {
            type: 'paragraph',
            text: 'Internet access may be used to access website resources, communicate with Planetary Hours services, retrieve application information, check for or download application updates, or submit contact and support requests.',
          },
        ],
      },
      {
        title: 'Contact and Retention',
        blocks: [
          {
            type: 'paragraph',
            text: 'Information voluntarily sent through contact methods may be retained for responding to inquiries, support records, identifying recurring issues, and improving existing products.',
          },
          {
            type: 'paragraph',
            text: 'Please avoid sending passwords, payment information, government identification numbers, medical information, or other highly sensitive information.',
          },
        ],
      },
      {
        title: 'Contact',
        blocks: [
          { type: 'paragraph', text: `For privacy questions, contact ${SUPPORT_EMAIL}.` },
        ],
      },
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    subtitle: 'Important information about app results.',
    websitePath: '/disclaimer',
    sections: [
      {
        title: 'General Information',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours provides information based on traditional planetary-hour calculation methods. The website and mobile application are intended for general informational, educational, cultural, and personal-reference purposes only.',
          },
          {
            type: 'paragraph',
            text: 'Planetary Hours does not claim that planetary-hour calculations are scientifically proven, universally accepted, or capable of producing guaranteed results.',
          },
        ],
      },
      {
        title: 'Traditional Calculations',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary-hour timings are calculated using traditional methods based primarily on local sunrise and sunset times.',
          },
          {
            type: 'paragraph',
            text: 'Different traditions, calculation systems, astronomical data providers, geographic assumptions, and rounding methods may produce slightly different results.',
          },
        ],
      },
      {
        title: 'No Guarantee of Results',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours does not guarantee that using a particular planetary hour will produce any specific result, benefit, event, outcome, or change in circumstances.',
          },
        ],
      },
      {
        title: 'Not Professional Advice',
        blocks: [
          {
            type: 'paragraph',
            text: 'The information provided by Planetary Hours is not medical, legal, financial, investment, psychological, religious, spiritual, business, or other professional advice.',
          },
        ],
      },
      {
        title: 'Location and Timing Limitations',
        blocks: [
          {
            type: 'paragraph',
            text: 'Sunrise, sunset, location accuracy, terrain, elevation, atmospheric conditions, device settings, timezone configuration, and daylight-saving rules may affect displayed times.',
          },
        ],
      },
      {
        title: 'Contact',
        blocks: [
          { type: 'paragraph', text: `For questions about this Disclaimer, contact ${SUPPORT_EMAIL}.` },
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    subtitle: 'Terms governing use of Planetary Hours.',
    websitePath: '/terms',
    sections: [
      {
        title: '1. Acceptance of These Terms',
        blocks: [
          {
            type: 'paragraph',
            text: 'These Terms of Use govern your access to and use of the Planetary Hours website, mobile application, content, features, and related services operated by Signal Growth.',
          },
          { type: 'paragraph', text: 'By accessing or using Planetary Hours, you agree to these Terms of Use.' },
          { type: 'paragraph', text: 'If you do not agree with these terms, you should not access or use the service.' },
        ],
      },
      {
        title: '2. About Planetary Hours',
        blocks: [
          { type: 'paragraph', text: 'Planetary Hours provides information based on traditional planetary-hour calculation methods.' },
          {
            type: 'paragraph',
            text: 'The service may display planetary-hour timings, sunrise and sunset information, day and night divisions, planetary rulers, and related educational or reference content.',
          },
          {
            type: 'paragraph',
            text: 'Planetary Hours does not claim that planetary-hour calculations are scientifically proven, universally accepted, or capable of producing guaranteed outcomes.',
          },
        ],
      },
      {
        title: '3. Eligibility',
        blocks: [
          {
            type: 'paragraph',
            text: 'You may use Planetary Hours only if you are legally capable of entering into an agreement under the laws applicable to you.',
          },
          {
            type: 'paragraph',
            text: 'If you use the service on behalf of an organisation, you confirm that you have authority to accept these Terms of Use on behalf of that organisation.',
          },
        ],
      },
      {
        title: '4. Permitted Use',
        blocks: [
          {
            type: 'paragraph',
            text: 'You may use Planetary Hours for lawful personal, educational, cultural, informational, and reference purposes.',
          },
          {
            type: 'list',
            items: [
              'Do not violate applicable law or regulation.',
              'Do not interfere with the operation, security, or availability of the service.',
              'Do not attempt unauthorised access to systems, data, accounts, or infrastructure.',
              'Do not copy, extract, republish, or commercially exploit substantial parts of the service without permission.',
              'Do not misrepresent Planetary Hours, Signal Growth, or the origin of the content.',
            ],
          },
        ],
      },
      {
        title: '5. Traditional Calculations and Timing Differences',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary-hour timings are calculated using traditional methods based primarily on local sunrise and sunset times.',
          },
          {
            type: 'paragraph',
            text: 'Different traditions, astronomical data providers, geographic assumptions, device settings, time-zone data, and rounding methods may produce slightly different timings.',
          },
          {
            type: 'paragraph',
            text: 'Planetary Hours aims to provide consistent and transparent calculations, but does not claim that one calculation method is the only correct method.',
          },
        ],
      },
      {
        title: '6. No Guarantee of Results',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours does not guarantee that using a particular planetary hour will produce a specific result, benefit, event, change, or outcome.',
          },
          {
            type: 'paragraph',
            text: 'Any interpretation or use of the information is entirely the responsibility of the user.',
          },
        ],
      },
      {
        title: '7. Not Professional Advice',
        blocks: [
          {
            type: 'paragraph',
            text: 'The information provided through Planetary Hours is not medical, legal, financial, investment, psychological, religious, spiritual, business, or other professional advice.',
          },
          {
            type: 'paragraph',
            text: 'You should consult an appropriately qualified professional before making decisions that may affect your health, finances, legal rights, safety, business, relationships, or well-being.',
          },
        ],
      },
      {
        title: '8. Location, Time Zone, Sunrise, and Sunset Data',
        blocks: [
          {
            type: 'paragraph',
            text: 'The service may use a selected location or device-provided foreground location to calculate local sunrise, sunset, and planetary-hour timings.',
          },
          {
            type: 'list',
            items: [
              'Device location accuracy.',
              'GPS and network availability.',
              'Time-zone settings and daylight-saving rules.',
              'Elevation, terrain, and atmospheric conditions.',
              'Astronomical data sources and software settings.',
            ],
          },
          {
            type: 'paragraph',
            text: 'You are responsible for confirming that the selected location, date, and time zone are correct before relying on displayed information.',
          },
        ],
      },
      {
        title: '9. Intellectual Property',
        blocks: [
          {
            type: 'paragraph',
            text: 'Unless otherwise stated, Planetary Hours, its branding, visual design, original text, software, interface, calculations, graphics, and related materials are owned by or licensed to Signal Growth.',
          },
          {
            type: 'paragraph',
            text: 'These materials are protected by applicable intellectual-property laws.',
          },
          {
            type: 'paragraph',
            text: 'You may not copy, reproduce, modify, distribute, republish, sell, license, reverse engineer, or commercially exploit protected materials except as permitted by law or with written permission.',
          },
        ],
      },
      {
        title: '10. Third-Party Services and Links',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours may contain links to application stores, websites, data services, platforms, or other third-party resources. Signal Growth does not control these third parties and is not responsible for their services.',
          },
          {
            type: 'paragraph',
            text: 'Your use of third-party services is subject to their own terms, privacy policies, and practices.',
          },
        ],
      },
      {
        title: '11. Service Availability',
        blocks: [
          {
            type: 'paragraph',
            text: 'We aim to keep Planetary Hours available and functioning properly, but we do not guarantee uninterrupted, continuous, secure, or error-free access.',
          },
          {
            type: 'paragraph',
            text: 'The service may be affected by maintenance, updates, technical problems, internet disruptions, hosting-provider issues, device limitations, or circumstances beyond our reasonable control.',
          },
        ],
      },
      {
        title: '12. Updates to the Service',
        blocks: [
          {
            type: 'paragraph',
            text: 'Features, interfaces, content, calculation methods, compatibility, availability, and technical requirements may change over time.',
          },
          {
            type: 'paragraph',
            text: 'We may release updates to improve functionality, security, accuracy, compatibility, or user experience.',
          },
        ],
      },
      {
        title: '13. User Devices and Internet Access',
        blocks: [
          {
            type: 'paragraph',
            text: 'You are responsible for the devices, operating systems, internet connection, mobile data, permissions, and other resources required to access Planetary Hours.',
          },
          {
            type: 'paragraph',
            text: 'Signal Growth is not responsible for charges imposed by internet, mobile, platform, or service providers.',
          },
        ],
      },
      {
        title: '14. Disclaimer of Warranties',
        blocks: [
          {
            type: 'paragraph',
            text: 'Planetary Hours is provided on an "as available" and "as is" basis to the extent permitted by law.',
          },
          {
            type: 'list',
            items: [
              'We do not guarantee that all information will always be complete or error-free.',
              'We do not guarantee that the service will always be available.',
              'We do not guarantee that calculations will match every tradition or expectation.',
              'Nothing in these Terms excludes any warranty or right that cannot legally be excluded.',
            ],
          },
        ],
      },
      {
        title: '15. Limitation of Liability',
        blocks: [
          {
            type: 'paragraph',
            text: 'To the maximum extent permitted by applicable law, Planetary Hours and Signal Growth will not be responsible for losses arising from reliance on planetary-hour information, inaccurate timing data, service interruption, third-party services, misuse, or circumstances beyond our reasonable control.',
          },
          {
            type: 'paragraph',
            text: 'Nothing in these Terms limits liability where such limitation is prohibited by law.',
          },
        ],
      },
      {
        title: '16. Indemnity',
        blocks: [
          {
            type: 'paragraph',
            text: "To the extent permitted by law, you agree to be responsible for losses, claims, liabilities, or expenses resulting from your unlawful misuse of Planetary Hours, violation of these Terms, or infringement of another party's rights.",
          },
        ],
      },
      {
        title: '17. Suspension or Termination',
        blocks: [
          {
            type: 'paragraph',
            text: 'We may restrict, suspend, or terminate access to Planetary Hours where reasonably necessary, including where a user violates these Terms, misuses the service, threatens security or operation, or where required by law.',
          },
        ],
      },
      {
        title: '18. Changes to These Terms',
        blocks: [
          {
            type: 'paragraph',
            text: 'We may update these Terms of Use when the service, features, calculation methods, legal requirements, or operating practices change.',
          },
          {
            type: 'paragraph',
            text: 'The revised version will be published on the Terms page with an updated Last updated date. Continued use after changes means the user accepts the revised Terms.',
          },
        ],
      },
      {
        title: '19. Severability',
        blocks: [
          {
            type: 'paragraph',
            text: 'If any part of these Terms is found to be invalid, unlawful, or unenforceable, the remaining provisions will continue to apply to the fullest extent permitted by law.',
          },
        ],
      },
      {
        title: '20. Entire Agreement',
        blocks: [
          {
            type: 'paragraph',
            text: 'These Terms of Use, together with the Privacy Policy and Disclaimer, form the agreement governing use of Planetary Hours.',
          },
        ],
      },
      {
        title: '21. Contact',
        blocks: [
          { type: 'paragraph', text: `For questions about these Terms of Use, contact ${SUPPORT_EMAIL}.` },
          { type: 'paragraph', text: 'Operated by: Signal Growth.' },
        ],
      },
    ],
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'Support, questions, and feedback.',
    websitePath: '/contact',
    sections: [
      {
        title: 'Support Email',
        blocks: [
          { type: 'paragraph', text: `Email: ${SUPPORT_EMAIL}` },
        ],
      },
      {
        title: 'What You Can Contact Us About',
        blocks: [
          {
            type: 'list',
            items: [
              'General questions.',
              'Technical problems.',
              'Incorrect location or timing information.',
              'Privacy questions.',
              'Feedback and suggestions.',
              'Application-store or download issues.',
            ],
          },
        ],
      },
      {
        title: 'Before Sending Sensitive Information',
        blocks: [
          {
            type: 'paragraph',
            text: 'Please avoid sending passwords, financial details, identity documents, medical information, or other highly sensitive information by email.',
          },
          {
            type: 'paragraph',
            text: 'Information you voluntarily provide may be retained as described in the Privacy Policy so we can respond to enquiries, understand reported issues, and improve Planetary Hours.',
          },
        ],
      },
    ],
  },
} satisfies Record<string, LegalPageContent>;

export const settingsLegalMenuItems: LegalMenuItem[] = [
  { accessibilityLabel: 'Open About Planetary Hours', href: '/settings/about', title: legalPages.about.title },
  { accessibilityLabel: 'Open Privacy Policy', href: '/settings/privacy-policy', title: legalPages.privacy.title },
  { accessibilityLabel: 'Open Disclaimer', href: '/settings/disclaimer', title: legalPages.disclaimer.title },
  { accessibilityLabel: 'Open Terms of Use', href: '/settings/terms', title: legalPages.terms.title },
  { accessibilityLabel: 'Open Contact Us', href: '/settings/contact', title: legalPages.contact.title },
] as const;
