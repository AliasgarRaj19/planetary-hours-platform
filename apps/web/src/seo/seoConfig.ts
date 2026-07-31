import seoData from './seoData.json';

export type SitemapChangeFrequency =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

export interface SeoRoute {
  path: string;
  title: string;
  description: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
}

export interface SeoPageMetadata extends SeoRoute {
  canonicalUrl: string;
  documentTitle: string;
}

export const siteSeo = seoData.site;
export const organizationSeo = seoData.organization;
export const verificationSeo = seoData.verification;
export const seoRoutes = seoData.routes as SeoRoute[];

export function getCanonicalUrl(path: string) {
  const normalizedPath = path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}`;

  return new URL(normalizedPath, siteSeo.url).toString();
}

export function getSeoRoute(pathname: string) {
  const normalizedPath = normalizeRoutePath(pathname);

  return seoRoutes.find((route) => route.path === normalizedPath) ?? seoRoutes[0];
}

export function getPageSeo(pathname: string): SeoPageMetadata {
  const route = getSeoRoute(pathname);
  const documentTitle =
    route.path === '/' ? siteSeo.defaultTitle : siteSeo.titleTemplate.replace('%s', route.title);

  return {
    ...route,
    canonicalUrl: getCanonicalUrl(route.path),
    documentTitle,
  };
}

function normalizeRoutePath(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return `/${pathname.replace(/^\/+|\/+$/g, '')}`;
}
