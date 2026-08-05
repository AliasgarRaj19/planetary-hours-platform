import { useEffect } from 'react';
import { buildArticleJsonLd } from './structuredData';
import { getCanonicalUrl, siteSeo } from './seoConfig';

export type DynamicSeoInput = {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export function useDynamicSeo(input: DynamicSeoInput | null) {
  useEffect(() => {
    if (!input) {
      resetArticleSeo();
      return removeArticleJsonLd;
    }

    const canonicalUrl = getCanonicalUrl(input.path);
    document.title =
      input.path === '/' ? siteSeo.defaultTitle : siteSeo.titleTemplate.replace('%s', input.title);

    setMetaTag('name', 'description', input.description);
    setCanonicalUrl(canonicalUrl);
    setMetaTag('property', 'og:type', input.type ?? 'website');
    setMetaTag('property', 'og:title', input.title);
    setMetaTag('property', 'og:description', input.description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('name', 'twitter:title', input.title);
    setMetaTag('name', 'twitter:description', input.description);

    if (input.type === 'article') {
      setJsonLdScript(
        'article-json-ld',
        buildArticleJsonLd({
          canonicalUrl,
          description: input.description,
          publishedAt: input.publishedAt,
          title: input.title,
          updatedAt: input.updatedAt,
        }),
      );
    }

    return removeArticleJsonLd;
  }, [input]);
}

function resetArticleSeo() {
  document.title = siteSeo.defaultTitle;
  setMetaTag('name', 'description', siteSeo.defaultDescription);
  setCanonicalUrl(siteSeo.url);
  setMetaTag('property', 'og:type', 'website');
  setMetaTag('property', 'og:title', siteSeo.name);
  setMetaTag('property', 'og:description', siteSeo.defaultDescription);
  setMetaTag('property', 'og:url', siteSeo.url);
  setMetaTag('name', 'twitter:title', siteSeo.name);
  setMetaTag('name', 'twitter:description', siteSeo.defaultDescription);
  removeArticleJsonLd();
}

function removeArticleJsonLd() {
  document.getElementById('article-json-ld')?.remove();
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

function setMetaTag(attribute: 'name' | 'property', key: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.append(meta);
  }

  meta.content = content;
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
