import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DIRECT_APK_MODE,
  GOOGLE_PLAY_MODE,
  STABLE_ANDROID_DOWNLOAD_PATH,
} from './app-distribution.constants';
import { AppDistributionService } from './app-distribution.service';
import type { AppDistributionRepository } from './app-distribution.repository';

describe('AppDistributionService', () => {
  let repository: RepositoryMock;
  let service: AppDistributionService;
  let distribution: DistributionFixture;
  let storagePath: string;

  beforeEach(async () => {
    storagePath = await mkdtemp(join(tmpdir(), 'app-distribution-'));
    distribution = createDistribution();
    repository = {
      findAndroidDistribution: jest.fn<
        () => Promise<DistributionFixture | null>
      >(() => Promise.resolve(distribution)),
      ensureAndroidDistribution: jest.fn<() => Promise<DistributionFixture>>(
        () => Promise.resolve(distribution),
      ),
      updateAndroidDistribution: jest.fn(
        (input: DistributionUpdateInput): Promise<DistributionFixture> => {
          distribution = {
            ...distribution,
            ...input,
            updatedAt: new Date(),
          };
          return Promise.resolve(distribution);
        },
      ),
      createAndroidArtifact: jest.fn(
        (
          input: ArtifactCreateInput,
        ): Promise<AppDistributionArtifactFixture> => {
          const artifact: AppDistributionArtifactFixture = {
            id: distribution.artifacts.length + 1,
            distributionId: distribution.id,
            createdAt: new Date('2026-08-04T00:00:00.000Z'),
            versionName: null,
            versionCode: null,
            ...input,
          };
          distribution.artifacts = [artifact, ...distribution.artifacts];
          return Promise.resolve(artifact);
        },
      ),
    };
    service = new AppDistributionService(
      repository as unknown as AppDistributionRepository,
      new ConfigService({
        app: {
          downloadStoragePath: storagePath,
          maxApkUploadBytes: 1024 * 1024,
        },
      }),
    );
  });

  afterEach(async () => {
    await rm(storagePath, { force: true, recursive: true });
  });

  it('returns active direct APK mode with the stable download action URL', async () => {
    const result = await service.getPublicAndroidDistribution();

    expect(result).toMatchObject({
      platform: 'android',
      activeMode: DIRECT_APK_MODE,
      isEnabled: true,
      actionUrl: STABLE_ANDROID_DOWNLOAD_PATH,
      artifact: {
        fileName: 'planetary-hours.apk',
      },
    });
  });

  it('returns Google Play mode with the configured store URL as the action URL', async () => {
    distribution.activeMode = GOOGLE_PLAY_MODE;
    distribution.storeUrl =
      'https://play.google.com/store/apps/details?id=com.planetaryhours.app';

    const result = await service.getPublicAndroidDistribution();

    expect(result).toMatchObject({
      activeMode: GOOGLE_PLAY_MODE,
      actionUrl: distribution.storeUrl,
      storeUrl: distribution.storeUrl,
      artifact: null,
    });
  });

  it('rejects invalid Play Store URLs', async () => {
    await expect(
      service.updateAndroidDistribution({
        activeMode: GOOGLE_PLAY_MODE,
        storeUrl: 'https://example.com/not-play',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns a disabled-state error for downloads when distribution is disabled', async () => {
    distribution.isEnabled = false;

    await expect(service.getAndroidDownloadTarget()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('uploads APK files with a checksum and preserves controlled file storage', async () => {
    const fileBuffer = Buffer.from('fake apk content');
    const result = await service.uploadAndroidApk(
      {
        buffer: fileBuffer,
        mimetype: 'application/vnd.android.package-archive',
        originalname: '../planetary-hours.apk',
        size: fileBuffer.length,
      },
      {
        versionName: '1.0.4',
        versionCode: 7,
      },
    );

    expect(result.artifact).toMatchObject({
      originalFileName: 'planetary-hours.apk',
      publicUrl: STABLE_ANDROID_DOWNLOAD_PATH,
      versionName: '1.0.4',
      versionCode: 7,
    });
    expect(result.artifact.checksumSha256).toHaveLength(64);
    await expect(readFile(result.artifact.fileName)).rejects.toThrow();

    const target = await service.getAndroidDownloadTarget();
    expect(target.type).toBe('file');
  });

  it('rejects non-APK uploads', async () => {
    await expect(
      service.uploadAndroidApk(
        {
          buffer: Buffer.from('not apk'),
          mimetype: 'text/plain',
          originalname: 'notes.txt',
          size: 7,
        },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

type DistributionFixture = {
  id: number;
  platform: 'android';
  activeMode: 'direct_apk' | 'google_play';
  storeUrl: string | null;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  artifacts: AppDistributionArtifactFixture[];
};

type AppDistributionArtifactFixture = {
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

type DistributionUpdateInput = {
  activeMode?: 'direct_apk' | 'google_play';
  isEnabled?: boolean;
  storeUrl?: string | null;
};

type ArtifactCreateInput = Omit<
  AppDistributionArtifactFixture,
  'createdAt' | 'distributionId' | 'id'
>;

type RepositoryMock = {
  findAndroidDistribution: jest.Mock<Promise<DistributionFixture | null>, []>;
  ensureAndroidDistribution: jest.Mock<Promise<DistributionFixture>, []>;
  updateAndroidDistribution: jest.Mock<
    Promise<DistributionFixture>,
    [DistributionUpdateInput]
  >;
  createAndroidArtifact: jest.Mock<
    Promise<AppDistributionArtifactFixture>,
    [ArtifactCreateInput]
  >;
};

function createDistribution(): DistributionFixture {
  return {
    id: 1,
    platform: 'android',
    activeMode: DIRECT_APK_MODE,
    storeUrl: null,
    isEnabled: true,
    createdAt: new Date('2026-08-04T00:00:00.000Z'),
    updatedAt: new Date('2026-08-04T00:00:00.000Z'),
    artifacts: [
      {
        id: 1,
        distributionId: 1,
        fileName: 'planetary-hours.apk',
        originalFileName: 'planetary-hours.apk',
        mimeType: 'application/vnd.android.package-archive',
        sizeBytes: 0,
        storagePath: '',
        publicUrl:
          'https://planetaryhours.in/downloads/planetary-hours-1.0.3-build6.apk',
        checksumSha256: '',
        versionName: '1.0.3',
        versionCode: 6,
        createdAt: new Date('2026-08-04T00:00:00.000Z'),
      },
    ],
  };
}
