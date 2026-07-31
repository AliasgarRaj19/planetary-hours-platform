import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDirectory, '..');
const seoDataPath = resolve(webRoot, 'src/seo/seoData.json');
const publicDirectory = resolve(webRoot, 'public');

const seoData = JSON.parse(await readFile(seoDataPath, 'utf8'));
const siteUrl = seoData.site.url.replace(/\/+$/, '');

await mkdir(publicDirectory, { recursive: true });

await writeFile(resolve(publicDirectory, 'robots.txt'), buildRobotsTxt(siteUrl), 'utf8');
await writeFile(resolve(publicDirectory, 'sitemap.xml'), buildSitemapXml(siteUrl, seoData.routes), 'utf8');

function buildRobotsTxt(baseUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

function buildSitemapXml(baseUrl, routes) {
  const urls = routes
    .map((route) => {
      const location = `${baseUrl}${route.path === '/' ? '/' : route.path}`;

      return `  <url>
    <loc>${escapeXml(location)}</loc>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
