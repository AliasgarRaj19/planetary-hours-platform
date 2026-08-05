import { Controller, Get, Header } from '@nestjs/common';
import { BlogService } from '../blog/blog.service';

const siteUrl = 'https://planetaryhours.in';
// Keep this list aligned with apps/web/src/seo/seoData.json until sitemap
// routes are moved into a shared deployment artifact.
const staticRoutes = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/schedule', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/disclaimer', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
];

@Controller('sitemap.xml')
export class SitemapController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  @Header('Content-Type', 'application/xml')
  async getSitemap() {
    const articles = await this.blogService.getSitemapArticles();
    const staticEntries = staticRoutes.map((route) =>
      buildUrlEntry({
        location: `${siteUrl}${route.path === '/' ? '/' : route.path}`,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      }),
    );
    const articleEntries = articles.map((article) =>
      buildUrlEntry({
        location: `${siteUrl}/blog/${article.slug}`,
        changeFrequency: 'monthly',
        priority: 0.7,
        lastModified: article.updatedAt,
      }),
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...articleEntries].join('\n')}
</urlset>
`;
  }
}

function buildUrlEntry(input: {
  location: string;
  changeFrequency: string;
  priority: number;
  lastModified?: Date;
}) {
  return `  <url>
    <loc>${escapeXml(input.location)}</loc>
${input.lastModified ? `    <lastmod>${input.lastModified.toISOString()}</lastmod>\n` : ''}    <changefreq>${input.changeFrequency}</changefreq>
    <priority>${input.priority.toFixed(1)}</priority>
  </url>`;
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
