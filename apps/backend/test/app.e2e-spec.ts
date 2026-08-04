import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from './../src/database/prisma.service';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/common/configure-app';

type ContentRecord = {
  id: number;
  dayOfWeek: number;
  hourNumber: number;
  description: string;
  suggestion: string;
  createdAt: Date;
  updatedAt: Date;
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let records: ContentRecord[];
  let distribution: AppDistributionRecord;
  let jwtService: JwtService;

  beforeEach(async () => {
    process.env.ADMIN_USERNAME = 'admin@example.com';
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('correct-password', 4);
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    records = createSeedRecords();
    distribution = createDistributionRecord();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(
        createPrismaMock(
          () => records,
          () => distribution,
        ),
      )
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

  it('/api/v1/auth/login (POST) rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@example.com',
        password: 'wrong-password',
      })
      .expect(401);
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

function createPrismaMock(
  getRecords: () => ContentRecord[],
  getDistribution: () => AppDistributionRecord,
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
    $transaction: jest.fn((operations: Array<Promise<ContentRecord>>) =>
      Promise.all(operations),
    ),
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
