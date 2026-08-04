import { useEffect } from 'react';
import {
  buildOrganizationJsonLd,
  buildWebApplicationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
} from './structuredData';
import {
  getPageSeo,
  siteSeo,
  verificationSeo,
  type SeoPageMetadata,
} from './seoConfig';

export function usePageSeo(pathname: string) {
  useEffect(() => {
    const pageSeo = getPageSeo(pathname);

    document.documentElement.lang = 'en';
    document.title = pageSeo.documentTitle;

    setMetaTag('name', 'description', pageSeo.description);
    setMetaTag('name', 'theme-color', siteSeo.themeColor);
    setMetaTag('name', 'google-site-verification', verificationSeo.google);
    setMetaTag('name', 'msvalidate.01', verificationSeo.bing);

    setCanonicalUrl(pageSeo.canonicalUrl);
    setOpenGraphTags(pageSeo);
    setTwitterTags(pageSeo);
    setStructuredData(pageSeo);
  }, [pathname]);
}

function setCanonicalUrl(url: string) {
  let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.append(canonicalLink);
  }

  canonicalLink.href = url;
}

function setOpenGraphTags(pageSeo: SeoPageMetadata) {
  const imageUrl = new URL(siteSeo.defaultImage, siteSeo.url).toString();

  setMetaTag('property', 'og:type', pageSeo.path === '/' ? 'website' : 'article');
  setMetaTag('property', 'og:title', pageSeo.title);
  setMetaTag('property', 'og:description', pageSeo.description);
  setMetaTag('property', 'og:url', pageSeo.canonicalUrl);
  setMetaTag('property', 'og:site_name', siteSeo.name);
  setMetaTag('property', 'og:locale', siteSeo.locale);
  setMetaTag('property', 'og:image', imageUrl);
  setMetaTag('property', 'og:image:alt', 'Planetary Hours calculator');
}

function setTwitterTags(pageSeo: SeoPageMetadata) {
  const imageUrl = new URL(siteSeo.defaultImage, siteSeo.url).toString();

  setMetaTag('name', 'twitter:card', 'summary');
  setMetaTag('name', 'twitter:title', pageSeo.title);
  setMetaTag('name', 'twitter:description', pageSeo.description);
  setMetaTag('name', 'twitter:image', imageUrl);
  setMetaTag('name', 'twitter:image:alt', 'Planetary Hours calculator');
}

function setStructuredData(pageSeo: SeoPageMetadata) {
  setJsonLdScript('website-json-ld', buildWebSiteJsonLd());
  setJsonLdScript('web-application-json-ld', buildWebApplicationJsonLd(pageSeo));
  setJsonLdScript('organization-json-ld', buildOrganizationJsonLd());

  if (pageSeo.path === '/schedule') {
    setJsonLdScript('web-page-json-ld', buildWebPageJsonLd(pageSeo));
  } else {
    document.getElementById('web-page-json-ld')?.remove();
  }
}

function setJsonLdScript(id: string, value: object) {
  let script = document.getElementById(id) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.append(script);
  }

  script.textContent = JSON.stringify(value);
}

function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.append(meta);
  }

  meta.content = content;
}
