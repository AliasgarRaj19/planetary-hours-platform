import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from './../src/database/prisma.service';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/common/configure-app';
import { GoogleAnalyticsDataService } from './../src/analytics/google-analytics-data.service';

type ContentRecord = {
  id: number;
  dayOfWeek: number;
  hourNumber: number;
  description: string;
  suggestion: string;
  createdAt: Date;
  updatedAt: Date;
};

type BlogCategoryResponse = {
  slug: string;
};

type BlogArticleResponse = {
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  categories: BlogCategoryResponse[];
};

type BlogArticleListResponse = {
  items: BlogArticleResponse[];
};

type AuditLogResponse = {
  items: AuditLogRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type GoogleAnalyticsMock = {
  runRealtimeReport: jest.Mock;
  runReport: jest.Mock;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let records: ContentRecord[];
  let distribution: AppDistributionRecord;
  let blogArticles: BlogArticleRecord[];
  let blogCategories: BlogCategoryRecord[];
  let auditLogs: AuditLogRecord[];
  let jwtService: JwtService;
  let googleAnalytics: GoogleAnalyticsMock;
  let downloadStoragePath: string;

  beforeEach(async () => {
    downloadStoragePath = await mkdtemp(
      join(tmpdir(), 'backend-e2e-downloads-'),
    );
    process.env.ADMIN_USERNAME = 'admin@example.com';
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('correct-password', 4);
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.DOWNLOAD_STORAGE_PATH = downloadStoragePath;

    records = createSeedRecords();
    distribution = createDistributionRecord();
    blogCategories = createBlogCategories();
    blogArticles = createBlogArticles(blogCategories);
    auditLogs = [];
    googleAnalytics = createGoogleAnalyticsMock();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(
        createPrismaMock(
          () => records,
          () => distribution,
          () => blogArticles,
          () => blogCategories,
          () => auditLogs,
        ),
      )
      .overrideProvider(GoogleAnalyticsDataService)
      .useValue(googleAnalytics)
      .compile();

    app = moduleFixture.createNestApplication();
    jwtService = app.get(JwtService);
    configureApp(app);
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        service: 'planetary-hours-backend',
        status: 'ok',
      });
  });

  it('/api/v1/planetary-hours/:dayOfWeek (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/planetary-hours/1')
      .expect(200)
      .expect((response) => {
        const body = response.body as ContentRecord[];

        expect(body).toHaveLength(24);
        expect(body.map((record: ContentRecord) => record.hourNumber)).toEqual(
          Array.from({ length: 24 }, (_, index) => index + 1),
        );
      });
  });

  it('/api/v1/app-distribution/android (GET) returns the active public mode', () => {
    return request(app.getHttpServer())
      .get('/api/v1/app-distribution/android')
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          platform: 'android',
          activeMode: 'direct_apk',
          isEnabled: true,
          actionUrl: '/api/v1/app-distribution/android/download',
        });
      });
  });

  it('/api/v1/app-distribution/android/download (GET) redirects to the current APK', () => {
    return request(app.getHttpServer())
      .get('/api/v1/app-distribution/android/download')
      .expect(302)
      .expect(
        'Location',
        'https://planetaryhours.in/downloads/planetary-hours-1.0.3-build6.apk',
      );
  });

  it('/api/v1/admin/app-distribution/android (PUT) rejects missing tokens', () => {
    return request(app.getHttpServer())
      .put('/api/v1/admin/app-distribution/android')
      .send({
        activeMode: 'google_play',
        storeUrl:
          'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
      })
      .expect(401);
  });

  it('/api/v1/admin/app-distribution/android (PUT) validates Play Store URLs', async () => {
    const token = await loginAndGetToken(app);

    return request(app.getHttpServer())
      .put('/api/v1/admin/app-distribution/android')
      .set('Authorization', `Bearer ${token}`)
      .send({
        activeMode: 'google_play',
        storeUrl: 'https://example.com/not-play-store',
      })
      .expect(400);
  });

  it('/api/v1/blog/articles (GET) returns only currently published articles', () => {
    return request(app.getHttpServer())
      .get('/api/v1/blog/articles')
      .expect(200)
      .expect((response) => {
        const body = response.body as BlogArticleListResponse;

        expect(body.items).toHaveLength(2);
        expect(body.items[0]).toMatchObject({
          title: 'Published Article',
          slug: 'published-article',
        });
      });
  });

  it('/api/v1/blog/articles (GET) filters by category', () => {
    return request(app.getHttpServer())
      .get('/api/v1/blog/articles?category=planetary-hours')
      .expect(200)
      .expect((response) => {
        const body = response.body as BlogArticleListResponse;

        expect(body.items).toHaveLength(1);
        expect(body.items[0].categories[0]).toMatchObject({
          slug: 'planetary-hours',
        });
      });
  });

  it('/api/v1/blog/articles/:slug (GET) hides drafts, unpublished, and future articles', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/published-article')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/draft-article')
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/unpublished-article')
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/future-article')
      .expect(404);
    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/published-without-date')
      .expect(404);
  });

  it('/api/v1/admin/blog/articles (POST) requires authentication', () => {
    return request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles')
      .send(createArticlePayload())
      .expect(401);
  });

  it('/api/v1/admin/blog/articles (POST) creates drafts with categories', async () => {
    const token = await loginAndGetToken(app);

    return request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles')
      .set('Authorization', `Bearer ${token}`)
      .send(createArticlePayload())
      .expect(201)
      .expect((response) => {
        const body = response.body as BlogArticleResponse;

        expect(body).toMatchObject({
          title: 'New Draft',
          slug: 'new-draft',
          status: 'draft',
        });
        expect(body.categories).toHaveLength(1);
      });
  });

  it('/api/v1/admin/blog/articles (POST) rejects invalid and duplicate slugs', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...createArticlePayload(), slug: 'Invalid Slug' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...createArticlePayload(), slug: 'published-article' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Slug is already in use',
        });
      });
  });

  it('/api/v1/admin/blog/articles/:id (PUT) rejects duplicate article slugs with controlled errors', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .put('/api/v1/admin/blog/articles/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'published-article' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Slug is already in use',
        });
      });
  });

  it('/api/v1/admin/blog/categories rejects duplicate slugs with controlled errors', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Duplicate Category', slug: 'planetary-hours' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Slug is already in use',
        });
      });

    await request(app.getHttpServer())
      .put('/api/v1/admin/blog/categories/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ slug: 'planetary-hours' })
      .expect(400)
      .expect((response) => {
        expect(response.body).toMatchObject({
          message: 'Slug is already in use',
        });
      });
  });

  it('/api/v1/admin/blog/articles/:id publish and unpublish changes public visibility', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles/2/publish')
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect((response) => {
        const body = response.body as BlogArticleResponse;

        expect(body.status).toBe('published');
        expect(body.publishedAt).toBeTruthy();
      });

    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/draft-article')
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles/2/unpublish')
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect((response) => {
        const body = response.body as BlogArticleResponse;

        expect(body.status).toBe('unpublished');
      });

    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/draft-article')
      .expect(404);
  });

  it('/api/v1/admin/blog/articles/:id/publish sets a scheduled article to publish now', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/future-article')
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles/4/publish')
      .set('Authorization', `Bearer ${token}`)
      .expect(201)
      .expect((response) => {
        const body = response.body as BlogArticleResponse;

        expect(body.status).toBe('published');
        expect(new Date(body.publishedAt ?? '').getTime()).toBeLessThanOrEqual(
          Date.now(),
        );
      });

    await request(app.getHttpServer())
      .get('/api/v1/blog/articles/future-article')
      .expect(200);
  });

  it('/api/v1/sitemap.xml includes published articles and excludes hidden articles', () => {
    return request(app.getHttpServer())
      .get('/api/v1/sitemap.xml')
      .expect(200)
      .expect((response) => {
        expect(response.headers['content-type']).toContain('application/xml');
        expect(response.text).toContain(
          '<?xml version="1.0" encoding="UTF-8"?>',
        );
        expect(response.text).toContain('https://planetaryhours.in/');
        expect(response.text).toContain('https://planetaryhours.in/about');
        expect(response.text).toContain('https://planetaryhours.in/schedule');
        expect(response.text).toContain('https://planetaryhours.in/blog');
        expect(response.text).toContain('https://planetaryhours.in/privacy');
        expect(response.text).toContain('https://planetaryhours.in/disclaimer');
        expect(response.text).toContain('https://planetaryhours.in/terms');
        expect(response.text).toContain('https://planetaryhours.in/contact');
        expect(response.text).toContain(
          'https://planetaryhours.in/blog/published-article',
        );
        expect(response.text).toContain(
          'https://planetaryhours.in/blog/escaped-&amp;-article',
        );
        expect(response.text).toContain(
          '<lastmod>2026-01-01T00:00:00.000Z</lastmod>',
        );
        expect(response.text).not.toContain('draft-article');
        expect(response.text).not.toContain('unpublished-article');
        expect(response.text).not.toContain('future-article');
        expect(response.text).not.toContain('published-without-date');
        expect(response.text).not.toContain(
          '<loc>https://planetaryhours.in/blog/draft-article</loc>',
        );
      });
  });

  it('/api/v1/planetary-hours/:dayOfWeek (PUT) rejects missing tokens', () => {
    return request(app.getHttpServer())
      .put('/api/v1/planetary-hours/1')
      .send(createPayload())
      .expect(401);
  });

  it('/api/v1/auth/login (POST) returns a bearer token', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@example.com',
        password: 'correct-password',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as {
          accessToken?: string;
          tokenType?: string;
        };

        expect(body.tokenType).toBe('Bearer');
        expect(typeof body.accessToken).toBe('string');
      });
  });

  it('/api/v1/auth/login (POST) creates success and failure audit logs without passwords', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@example.com',
        password: 'correct-password',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@example.com',
        password: 'wrong-password',
      })
      .expect(401);

    expect(auditLogs.map((log) => log.action)).toEqual([
      'auth.login.success',
      'auth.login.failure',
    ]);
    expect(JSON.stringify(auditLogs)).not.toContain('correct-password');
    expect(JSON.stringify(auditLogs)).not.toContain('wrong-password');
    expect(JSON.stringify(auditLogs)).not.toContain('Bearer');
  });

  it('/api/v1/auth/login (POST) rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@example.com',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('/api/v1/admin/analytics/realtime rejects missing tokens', () => {
    return request(app.getHttpServer())
      .get('/api/v1/admin/analytics/realtime')
      .expect(401);
  });

  it('/api/v1/admin/analytics/overview validates supported ranges', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .get('/api/v1/admin/analytics/overview?range=90d')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('/api/v1/admin/analytics/overview returns mapped GA metrics with a valid token', async () => {
    const token = await loginAndGetToken(app);

    return request(app.getHttpServer())
      .get('/api/v1/admin/analytics/overview?range=7d')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          range: '7d',
          users: 10,
          sessions: 5,
          views: 20,
          engagementRate: 0.6,
          averageEngagementTimeSeconds: 20,
        });
      });
  });

  it('/api/v1/planetary-hours/:dayOfWeek (PUT) updates descriptions with a valid token', async () => {
    const payload = Array.from({ length: 24 }, (_, index) => ({
      hourNumber: index + 1,
      description: `Description ${index + 1}`,
      suggestion: `Suggestion ${index + 1}`,
    }));
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .put('/api/v1/planetary-hours/2')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200)
      .expect((response) => {
        const body = response.body as ContentRecord[];

        expect(body).toHaveLength(24);
        expect(body[0]).toMatchObject({
          dayOfWeek: 2,
          hourNumber: 1,
          description: 'Description 1',
          suggestion: 'Suggestion 1',
        });
      });
  });

  it('creates audit logs for admin mutations and exposes them newest-first with filters', async () => {
    const token = await loginAndGetToken(app);
    auditLogs = [];
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles')
      .set('Authorization', `Bearer ${token}`)
      .send(createArticlePayload())
      .expect(201);

    await request(app.getHttpServer())
      .put('/api/v1/admin/blog/articles/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Draft' })
      .expect(200);

    await request(app.getHttpServer())
      .put('/api/v1/admin/blog/articles/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published', publishedAt: futureDate })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles/2/publish')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/articles/2/unpublish')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/admin/blog/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Category', slug: 'new-category' })
      .expect(201);

    await request(app.getHttpServer())
      .put('/api/v1/admin/blog/categories/2')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Timing', slug: 'timing-updated' })
      .expect(200);

    await request(app.getHttpServer())
      .put('/api/v1/admin/app-distribution/android')
      .set('Authorization', `Bearer ${token}`)
      .send({
        activeMode: 'google_play',
        storeUrl:
          'https://play.google.com/store/apps/details?id=com.planetaryhours.app',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/admin/app-distribution/android/apk')
      .set('Authorization', `Bearer ${token}`)
      .field('versionName', '1.0.4')
      .field('versionCode', '8')
      .attach('apk', Buffer.from('fake apk'), {
        filename: 'planetary-hours.apk',
        contentType: 'application/vnd.android.package-archive',
      })
      .expect(201);

    await request(app.getHttpServer())
      .put('/api/v1/planetary-hours/3')
      .set('Authorization', `Bearer ${token}`)
      .send(createPayload())
      .expect(200);

    expect(auditLogs.map((log) => log.action)).toEqual([
      'blog.article.create',
      'blog.article.update',
      'blog.article.schedule',
      'blog.article.publish',
      'blog.article.unpublish',
      'blog.category.create',
      'blog.category.update',
      'app_distribution.settings_update',
      'app_distribution.apk_upload',
      'planetary_hours.day_content_update',
    ]);
    expect(JSON.stringify(auditLogs)).not.toContain(token);

    await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs?module=blog&page=1&pageSize=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((response) => {
        const body = response.body as AuditLogResponse;

        expect(body.items).toHaveLength(2);
        expect(body.items[0].module).toBe('blog');
        expect(body.pagination.total).toBe(7);
      });
  });

  it('keeps successful business mutations successful when audit persistence fails', async () => {
    const token = await loginAndGetToken(app);
    const prisma = app.get(PrismaService);
    (prisma.auditLog.create as unknown as jest.Mock).mockRejectedValueOnce(
      new Error('audit failed'),
    );

    await request(app.getHttpServer())
      .put('/api/v1/planetary-hours/2')
      .set('Authorization', `Bearer ${token}`)
      .send(createPayload())
      .expect(200);
  });

  it('/api/v1/admin/audit-logs (GET) requires JWT and validates queries', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs?page=0')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('does not expose mutation endpoints for audit logs', async () => {
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .post('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(404);

    await request(app.getHttpServer())
      .put('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(404);

    await request(app.getHttpServer())
      .patch('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(404);

    await request(app.getHttpServer())
      .delete('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('/api/v1/planetary-hours/:dayOfWeek (PUT) rejects duplicate hours', async () => {
    const payload = Array.from({ length: 24 }, (_, index) => ({
      hourNumber: index === 23 ? 1 : index + 1,
      description: '',
      suggestion: '',
    }));
    const token = await loginAndGetToken(app);

    await request(app.getHttpServer())
      .put('/api/v1/planetary-hours/1')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400);
  });

  it('/api/v1/planetary-hours/:dayOfWeek (PUT) rejects expired tokens', async () => {
    const expiredToken = await jwtService.signAsync(
      {
        sub: 'admin@example.com',
        username: 'admin@example.com',
      },
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .put('/api/v1/planetary-hours/1')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send(createPayload())
      .expect(401);
  });

  it('/api/v1/planetary-hours/:dayOfWeek rejects invalid days', () => {
    return request(app.getHttpServer())
      .get('/api/v1/planetary-hours/8')
      .expect(400);
  });

  afterEach(async () => {
    await app.close();
    await rm(downloadStoragePath, { force: true, recursive: true });
  });
});

async function loginAndGetToken(app: INestApplication<App>) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      username: 'admin@example.com',
      password: 'correct-password',
    })
    .expect(201);
  const body = response.body as { accessToken: string };

  return body.accessToken;
}

function createPayload() {
  return Array.from({ length: 24 }, (_, index) => ({
    hourNumber: index + 1,
    description: '',
    suggestion: '',
  }));
}

function createArticlePayload() {
  return {
    title: 'New Draft',
    slug: 'new-draft',
    excerpt: 'A new draft article.',
    bodyMarkdown: '# Heading\n\nArticle body.',
    categoryIds: [1],
  };
}

function createSeedRecords() {
  return Array.from({ length: 7 }, (_, dayIndex) =>
    Array.from({ length: 24 }, (_, hourIndex) => ({
      id: dayIndex * 24 + hourIndex + 1,
      dayOfWeek: dayIndex + 1,
      hourNumber: hourIndex + 1,
      description: '',
      suggestion: '',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    })),
  ).flat();
}

class PrismaUniqueConstraintError extends Error {
  readonly code = 'P2002';

  constructor() {
    super('Unique constraint failed');
  }
}

function createPrismaMock(
  getRecords: () => ContentRecord[],
  getDistribution: () => AppDistributionRecord,
  getBlogArticles: () => BlogArticleRecord[],
  getBlogCategories: () => BlogCategoryRecord[],
  getAuditLogs: () => AuditLogRecord[],
) {
  return {
    planetaryHourContent: {
      findMany: jest.fn((args: { where: { dayOfWeek: number } }) =>
        Promise.resolve(
          getRecords()
            .filter((record) => record.dayOfWeek === args.where.dayOfWeek)
            .sort((first, second) => first.hourNumber - second.hourNumber),
        ),
      ),
      upsert: jest.fn((args: UpsertArgs) => {
        const records = getRecords();
        const existingRecord = records.find(
          (record) =>
            record.dayOfWeek === args.where.dayOfWeek_hourNumber.dayOfWeek &&
            record.hourNumber === args.where.dayOfWeek_hourNumber.hourNumber,
        );

        if (existingRecord) {
          Object.assign(existingRecord, args.update, { updatedAt: new Date() });
          return Promise.resolve(existingRecord);
        }

        const createdRecord = {
          id: records.length + 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.create,
        };
        records.push(createdRecord);
        return Promise.resolve(createdRecord);
      }),
    },
    appDistribution: {
      findUnique: jest.fn(() => Promise.resolve(getDistribution())),
      upsert: jest.fn(() => Promise.resolve(getDistribution())),
      update: jest.fn((args: { data: Partial<AppDistributionRecord> }) => {
        Object.assign(getDistribution(), args.data, { updatedAt: new Date() });
        return Promise.resolve(getDistribution());
      }),
    },
    appDistributionArtifact: {
      create: jest.fn((args: { data: Record<string, unknown> }) => {
        const artifact = {
          id: getDistribution().artifacts.length + 1,
          createdAt: new Date(),
          ...args.data,
        };
        getDistribution().artifacts.unshift(
          artifact as AppDistributionArtifactRecord,
        );
        return Promise.resolve(artifact);
      }),
      count: jest.fn(() => Promise.resolve(getDistribution().artifacts.length)),
    },
    blogArticle: {
      findMany: jest.fn((args?: BlogFindManyArgs) =>
        Promise.resolve(
          findBlogArticles(getBlogArticles(), getBlogCategories(), args),
        ),
      ),
      count: jest.fn((args?: BlogFindManyArgs) =>
        Promise.resolve(
          findBlogArticles(getBlogArticles(), getBlogCategories(), args).length,
        ),
      ),
      findFirst: jest.fn((args: BlogFindFirstArgs) =>
        Promise.resolve(
          findBlogArticles(getBlogArticles(), getBlogCategories(), {
            where: args.where,
          })[0] ?? null,
        ),
      ),
      findUnique: jest.fn((args: { where: { id: number } }) =>
        Promise.resolve(
          toBlogArticleWithCategories(
            getBlogArticles().find((article) => article.id === args.where.id),
            getBlogCategories(),
          ),
        ),
      ),
      create: jest.fn((args: BlogCreateArgs) => {
        if (
          getBlogArticles().some((article) => article.slug === args.data.slug)
        ) {
          return Promise.reject(new PrismaUniqueConstraintError());
        }

        const article = {
          id: getBlogArticles().length + 1,
          title: args.data.title,
          slug: args.data.slug,
          excerpt: args.data.excerpt,
          bodyMarkdown: args.data.bodyMarkdown,
          status: args.data.status ?? 'draft',
          seoTitle: args.data.seoTitle ?? null,
          seoDescription: args.data.seoDescription ?? null,
          publishedAt: args.data.publishedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          categoryIds:
            args.data.categories?.create.map((item) => item.categoryId) ?? [],
        } satisfies BlogArticleRecord;
        getBlogArticles().push(article);
        return Promise.resolve(
          toBlogArticleWithCategories(article, getBlogCategories()),
        );
      }),
      update: jest.fn((args: BlogUpdateArgs) => {
        const article = getBlogArticles().find(
          (item) => item.id === args.where.id,
        );

        if (!article) {
          return Promise.reject(new Error('not found'));
        }

        if (
          args.data.slug &&
          getBlogArticles().some(
            (item) => item.slug === args.data.slug && item.id !== article.id,
          )
        ) {
          return Promise.reject(new PrismaUniqueConstraintError());
        }

        Object.assign(article, args.data, { updatedAt: new Date() });
        if (args.data.categories?.create) {
          article.categoryIds = args.data.categories.create.map(
            (item) => item.categoryId,
          );
        }
        return Promise.resolve(
          toBlogArticleWithCategories(article, getBlogCategories()),
        );
      }),
    },
    blogCategory: {
      findMany: jest.fn((args?: { where?: { id?: { in: number[] } } }) => {
        const categories = getBlogCategories();
        if (args?.where?.id?.in) {
          return Promise.resolve(
            categories.filter((category) =>
              args.where?.id?.in.includes(category.id),
            ),
          );
        }
        return Promise.resolve(categories);
      }),
      create: jest.fn((args: { data: BlogCategoryInput }) => {
        if (
          getBlogCategories().some(
            (category) => category.slug === args.data.slug,
          )
        ) {
          return Promise.reject(new PrismaUniqueConstraintError());
        }
        const category = {
          id: getBlogCategories().length + 1,
          description: '',
          seoTitle: null,
          seoDescription: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...args.data,
        };
        getBlogCategories().push(category);
        return Promise.resolve(category);
      }),
      update: jest.fn(
        (args: { where: { id: number }; data: Partial<BlogCategoryInput> }) => {
          const category = getBlogCategories().find(
            (item) => item.id === args.where.id,
          );
          if (!category) {
            return Promise.reject(new Error('not found'));
          }
          if (
            args.data.slug &&
            getBlogCategories().some(
              (item) => item.slug === args.data.slug && item.id !== category.id,
            )
          ) {
            return Promise.reject(new PrismaUniqueConstraintError());
          }
          Object.assign(category, args.data, { updatedAt: new Date() });
          return Promise.resolve(category);
        },
      ),
    },
    blogArticleCategory: {
      deleteMany: jest.fn((args: { where: { articleId: number } }) => {
        const article = getBlogArticles().find(
          (item) => item.id === args.where.articleId,
        );
        if (article) {
          article.categoryIds = [];
        }
        return Promise.resolve({ count: 0 });
      }),
    },
    auditLog: {
      create: jest.fn((args: { data: AuditLogCreateInput }) => {
        const record = {
          id: `audit_${getAuditLogs().length + 1}`,
          createdAt: new Date(),
          actorType: args.data.actorType ?? 'admin',
          actorId: args.data.actorId ?? null,
          actorUsername: args.data.actorUsername ?? null,
          actorDisplayName: args.data.actorDisplayName ?? null,
          actorRole: args.data.actorRole ?? null,
          action: args.data.action,
          module: args.data.module,
          resourceType: args.data.resourceType,
          resourceId: args.data.resourceId ?? null,
          resourceDisplayName: args.data.resourceDisplayName ?? null,
          description: args.data.description,
          result: args.data.result,
          metadata: args.data.metadata ?? null,
          ipAddress: args.data.ipAddress ?? null,
          userAgent: args.data.userAgent ?? null,
          requestId: args.data.requestId ?? null,
        } satisfies AuditLogRecord;
        getAuditLogs().push(record);
        return Promise.resolve(record);
      }),
      findMany: jest.fn((args?: AuditLogFindManyArgs) =>
        Promise.resolve(findAuditLogs(getAuditLogs(), args)),
      ),
      count: jest.fn((args?: AuditLogFindManyArgs) =>
        Promise.resolve(findAuditLogs(getAuditLogs(), args).length),
      ),
    },
    $transaction: jest.fn((operations: Array<Promise<ContentRecord>>) =>
      Promise.all(operations),
    ),
  };
}

function createGoogleAnalyticsMock(): GoogleAnalyticsMock {
  return {
    runRealtimeReport: jest
      .fn()
      .mockResolvedValueOnce(analyticsReport([analyticsRow([], ['2'])]))
      .mockResolvedValueOnce(
        analyticsReport([analyticsRow(['/schedule', 'Schedule'], ['2', '4'])]),
      )
      .mockResolvedValueOnce(
        analyticsReport([analyticsRow(['app_download_click'], ['3'])]),
      ),
    runReport: jest
      .fn()
      .mockResolvedValueOnce(
        analyticsReport([analyticsRow([], ['10', '5', '20', '0.6', '100'])]),
      )
      .mockResolvedValue(analyticsReport([])),
  };
}

function analyticsReport(rows: Array<Record<string, unknown>>) {
  return { rows };
}

function analyticsRow(dimensions: string[], metrics: string[]) {
  return {
    dimensionValues: dimensions.map((value) => ({ value })),
    metricValues: metrics.map((value) => ({ value })),
  };
}

type UpsertArgs = {
  where: {
    dayOfWeek_hourNumber: {
      dayOfWeek: number;
      hourNumber: number;
    };
  };
  update: {
    description: string;
    suggestion: string;
  };
  create: {
    dayOfWeek: number;
    hourNumber: number;
    description: string;
    suggestion: string;
  };
};

type AppDistributionArtifactRecord = {
  id: number;
  distributionId: number;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  publicUrl: string;
  checksumSha256: string;
  versionName: string | null;
  versionCode: number | null;
  createdAt: Date;
};

type AppDistributionRecord = {
  id: number;
  platform: 'android';
  activeMode: 'direct_apk' | 'google_play';
  storeUrl: string | null;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  artifacts: AppDistributionArtifactRecord[];
};

function createDistributionRecord(): AppDistributionRecord {
  return {
    id: 1,
    platform: 'android',
    activeMode: 'direct_apk',
    storeUrl: null,
    isEnabled: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    artifacts: [
      {
        id: 1,
        distributionId: 1,
        fileName: 'planetary-hours-1.0.3-build6.apk',
        originalFileName: 'planetary-hours-1.0.3-build6.apk',
        mimeType: 'application/vnd.android.package-archive',
        sizeBytes: 0,
        storagePath: '',
        publicUrl:
          'https://planetaryhours.in/downloads/planetary-hours-1.0.3-build6.apk',
        checksumSha256: '',
        versionName: '1.0.3',
        versionCode: 6,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  };
}

type BlogCategoryRecord = {
  id: number;
  name: string;
  slug: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type BlogArticleRecord = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  status: 'draft' | 'published' | 'unpublished';
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryIds: number[];
};

type BlogCategoryInput = Partial<BlogCategoryRecord> & {
  name: string;
  slug: string;
};

type BlogFindManyArgs = {
  where?: {
    AND?: Array<{ publishedAt: { lte?: Date; not?: null } }>;
    slug?: string;
    status?: string;
    publishedAt?: { lte: Date };
    categories?: { some: { category: { slug: string } } };
  };
  skip?: number;
  take?: number;
};

type BlogFindFirstArgs = {
  where: NonNullable<BlogFindManyArgs['where']>;
};

type BlogCreateArgs = {
  data: {
    title: string;
    slug: string;
    excerpt: string;
    bodyMarkdown: string;
    status?: 'draft' | 'published' | 'unpublished';
    seoTitle?: string | null;
    seoDescription?: string | null;
    publishedAt?: Date | null;
    categories?: { create: Array<{ categoryId: number }> };
  };
};

type BlogUpdateArgs = {
  where: { id: number };
  data: Partial<BlogCreateArgs['data']>;
};

type AuditLogRecord = {
  id: string;
  createdAt: Date;
  actorType: string;
  actorId: string | null;
  actorUsername: string | null;
  actorDisplayName: string | null;
  actorRole: string | null;
  action: string;
  module: string;
  resourceType: string;
  resourceId: string | null;
  resourceDisplayName: string | null;
  description: string;
  result: 'success' | 'failure';
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
};

type AuditLogCreateInput = Omit<AuditLogRecord, 'createdAt' | 'id'>;

type AuditLogFindManyArgs = {
  where?: {
    AND?: Array<{
      module?: string;
      action?: string;
      result?: 'success' | 'failure';
      resourceType?: string;
      resourceId?: string;
      createdAt?: { gte?: Date; lte?: Date };
      OR?: Array<Record<string, unknown>>;
    }>;
  };
  skip?: number;
  take?: number;
};

function createBlogCategories(): BlogCategoryRecord[] {
  return [
    {
      id: 1,
      name: 'Planetary Hours',
      slug: 'planetary-hours',
      description: '',
      seoTitle: null,
      seoDescription: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      id: 2,
      name: 'Timing',
      slug: 'timing',
      description: '',
      seoTitle: null,
      seoDescription: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  ];
}

function createBlogArticles(
  categories: BlogCategoryRecord[],
): BlogArticleRecord[] {
  const [category, secondaryCategory] = categories;

  return [
    createBlogArticle({
      id: 1,
      title: 'Published Article',
      slug: 'published-article',
      status: 'published',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      categoryIds: [category.id],
    }),
    createBlogArticle({
      id: 2,
      title: 'Draft Article',
      slug: 'draft-article',
      status: 'draft',
      publishedAt: null,
      categoryIds: [category.id],
    }),
    createBlogArticle({
      id: 3,
      title: 'Unpublished Article',
      slug: 'unpublished-article',
      status: 'unpublished',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      categoryIds: [category.id],
    }),
    createBlogArticle({
      id: 4,
      title: 'Future Article',
      slug: 'future-article',
      status: 'published',
      publishedAt: new Date('2999-01-01T00:00:00.000Z'),
      categoryIds: [category.id],
    }),
    createBlogArticle({
      id: 5,
      title: 'Published Without Date',
      slug: 'published-without-date',
      status: 'published',
      publishedAt: null,
      categoryIds: [category.id],
    }),
    createBlogArticle({
      id: 6,
      title: 'Escaped Article',
      slug: 'escaped-&-article',
      status: 'published',
      publishedAt: new Date('2026-01-01T00:00:00.000Z'),
      categoryIds: [secondaryCategory.id],
    }),
  ];
}

function createBlogArticle(
  input: Pick<
    BlogArticleRecord,
    'categoryIds' | 'id' | 'publishedAt' | 'slug' | 'status' | 'title'
  >,
): BlogArticleRecord {
  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    excerpt: `${input.title} excerpt.`,
    bodyMarkdown: '# Article body',
    status: input.status,
    seoTitle: null,
    seoDescription: null,
    publishedAt: input.publishedAt,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    categoryIds: input.categoryIds,
  };
}

function findBlogArticles(
  articles: BlogArticleRecord[],
  categories: BlogCategoryRecord[],
  args?: BlogFindManyArgs,
) {
  let result = articles;

  if (args?.where?.slug) {
    result = result.filter((article) => article.slug === args.where?.slug);
  }

  if (args?.where?.status) {
    result = result.filter((article) => article.status === args.where?.status);
  }

  if (args?.where?.publishedAt?.lte) {
    result = result.filter(
      (article) =>
        article.publishedAt !== null &&
        article.publishedAt.getTime() <= args.where!.publishedAt!.lte.getTime(),
    );
  }

  for (const condition of args?.where?.AND ?? []) {
    if ('not' in condition.publishedAt) {
      result = result.filter((article) => article.publishedAt !== null);
    }

    if (condition.publishedAt.lte) {
      result = result.filter(
        (article) =>
          article.publishedAt !== null &&
          article.publishedAt.getTime() <= condition.publishedAt.lte!.getTime(),
      );
    }
  }

  if (args?.where?.categories?.some.category.slug) {
    const category = categories.find(
      (item) => item.slug === args.where?.categories?.some.category.slug,
    );
    result = category
      ? result.filter((article) => article.categoryIds.includes(category.id))
      : [];
  }

  result = [...result].sort(
    (first, second) => second.updatedAt.getTime() - first.updatedAt.getTime(),
  );

  if (typeof args?.skip === 'number' || typeof args?.take === 'number') {
    result = result.slice(
      args.skip ?? 0,
      (args.skip ?? 0) + (args.take ?? result.length),
    );
  }

  return result.map((article) =>
    toBlogArticleWithCategories(article, categories),
  );
}

function toBlogArticleWithCategories(
  article: BlogArticleRecord | undefined,
  categories: BlogCategoryRecord[],
) {
  if (!article) {
    return null;
  }

  return {
    ...article,
    categories: article.categoryIds.map((categoryId) => ({
      articleId: article.id,
      categoryId,
      category: categories.find((category) => category.id === categoryId)!,
    })),
  };
}

function findAuditLogs(logs: AuditLogRecord[], args?: AuditLogFindManyArgs) {
  let result = logs;

  for (const condition of args?.where?.AND ?? []) {
    if (condition.module) {
      result = result.filter((log) => log.module === condition.module);
    }

    if (condition.action) {
      result = result.filter((log) => log.action === condition.action);
    }

    if (condition.result) {
      result = result.filter((log) => log.result === condition.result);
    }

    if (condition.resourceType) {
      result = result.filter(
        (log) => log.resourceType === condition.resourceType,
      );
    }

    if (condition.resourceId) {
      result = result.filter((log) => log.resourceId === condition.resourceId);
    }

    if (condition.createdAt?.gte) {
      result = result.filter(
        (log) => log.createdAt.getTime() >= condition.createdAt!.gte!.getTime(),
      );
    }

    if (condition.createdAt?.lte) {
      result = result.filter(
        (log) => log.createdAt.getTime() <= condition.createdAt!.lte!.getTime(),
      );
    }
  }

  result = [...result].sort(
    (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
  );

  if (typeof args?.skip === 'number' || typeof args?.take === 'number') {
    result = result.slice(
      args.skip ?? 0,
      (args.skip ?? 0) + (args.take ?? result.length),
    );
  }

  return result;
}
