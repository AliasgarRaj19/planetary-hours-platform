import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import {
  ANDROID_PLATFORM,
  DIRECT_APK_MODE,
  GOOGLE_PLAY_MODE,
  STABLE_ANDROID_DOWNLOAD_PATH,
} from './app-distribution.constants';
import { AppDistributionRepository } from './app-distribution.repository';
import type { UpdateAppDistributionDto } from './dto/update-app-distribution.dto';
import type { UploadApkDto } from './dto/upload-apk.dto';

type UploadedApkFile = {
  buffer?: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
};

type DistributionRecord = Awaited<
  ReturnType<AppDistributionRepository['ensureAndroidDistribution']>
>;

@Injectable()
export class AppDistributionService {
  constructor(
    private readonly repository: AppDistributionRepository,
    private readonly configService: ConfigService,
  ) {}

  async getPublicAndroidDistribution() {
    const distribution = await this.getAndroidDistribution();
    return this.toPublicResponse(distribution);
  }

  async getAdminAndroidDistribution() {
    const distribution = await this.getAndroidDistribution();
    return this.toPublicResponse(distribution);
  }

  async updateAndroidDistribution(dto: UpdateAppDistributionDto) {
    await this.getAndroidDistribution();
    const nextMode = dto.activeMode;
    const storeUrl =
      typeof dto.storeUrl === 'string' && dto.storeUrl.trim()
        ? dto.storeUrl.trim()
        : dto.storeUrl === null
          ? null
          : undefined;

    if (nextMode === GOOGLE_PLAY_MODE && !storeUrl) {
      throw new BadRequestException(
        'Google Play URL is required for Google Play mode',
      );
    }

    if (storeUrl) {
      this.assertValidPlayStoreUrl(storeUrl);
    }

    const distribution = await this.repository.updateAndroidDistribution({
      activeMode: nextMode,
      isEnabled: dto.isEnabled,
      storeUrl,
    });

    return this.toPublicResponse(distribution);
  }

  async uploadAndroidApk(file: UploadedApkFile | undefined, dto: UploadApkDto) {
    if (!file?.buffer || !file.originalname || typeof file.size !== 'number') {
      throw new BadRequestException('APK file is required');
    }

    this.assertValidApk(file);

    const storagePath = this.getStoragePath();
    await mkdir(storagePath, { recursive: true });

    const safeVersion = sanitizeFileSegment(dto.versionName ?? 'android');
    const fileName = `planetary-hours-${safeVersion}-${Date.now()}-${randomUUID()}.apk`;
    const finalPath = join(storagePath, fileName);
    const tempPath = `${finalPath}.tmp`;
    const checksumSha256 = createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    await writeFile(tempPath, file.buffer);
    await rename(tempPath, finalPath);

    const artifact = await this.repository.createAndroidArtifact({
      fileName,
      originalFileName: basename(file.originalname),
      mimeType: file.mimetype ?? 'application/vnd.android.package-archive',
      sizeBytes: file.size,
      storagePath: finalPath,
      publicUrl: STABLE_ANDROID_DOWNLOAD_PATH,
      checksumSha256,
      versionName: dto.versionName,
      versionCode: dto.versionCode,
    });
    const distribution = await this.repository.updateAndroidDistribution({
      activeMode: DIRECT_APK_MODE,
    });

    return {
      distribution: this.toPublicResponse(distribution),
      artifact: this.toArtifactResponse(artifact),
    };
  }

  async getAndroidDownloadTarget() {
    const distribution = await this.getAndroidDistribution();

    if (!distribution.isEnabled) {
      throw new ServiceUnavailableException('App distribution is disabled');
    }

    if (distribution.activeMode === GOOGLE_PLAY_MODE) {
      if (!distribution.storeUrl) {
        throw new ServiceUnavailableException(
          'Google Play URL is not configured',
        );
      }

      return { type: 'redirect' as const, url: distribution.storeUrl };
    }

    const artifact = distribution.artifacts[0];

    if (!artifact) {
      throw new ServiceUnavailableException('APK is not configured');
    }

    if (artifact.storagePath) {
      return {
        type: 'file' as const,
        filePath: artifact.storagePath,
        fileName: artifact.fileName,
      };
    }

    if (artifact.publicUrl) {
      return { type: 'redirect' as const, url: artifact.publicUrl };
    }

    throw new ServiceUnavailableException('APK is not configured');
  }

  private async getAndroidDistribution() {
    return (
      (await this.repository.findAndroidDistribution()) ??
      (await this.repository.ensureAndroidDistribution())
    );
  }

  private toPublicResponse(distribution: DistributionRecord) {
    const artifact = distribution.artifacts[0];
    const actionUrl =
      distribution.activeMode === GOOGLE_PLAY_MODE
        ? distribution.storeUrl
        : STABLE_ANDROID_DOWNLOAD_PATH;

    return {
      platform: ANDROID_PLATFORM,
      activeMode: distribution.activeMode,
      isEnabled: distribution.isEnabled,
      label:
        distribution.activeMode === GOOGLE_PLAY_MODE
          ? 'Get it on Google Play'
          : 'Download Android App',
      actionUrl,
      storeUrl:
        distribution.activeMode === GOOGLE_PLAY_MODE
          ? distribution.storeUrl
          : null,
      artifact:
        distribution.activeMode === DIRECT_APK_MODE && artifact
          ? this.toArtifactResponse(artifact)
          : null,
    };
  }

  private toArtifactResponse(artifact: {
    fileName: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    publicUrl: string;
    checksumSha256: string;
    versionName: string | null;
    versionCode: number | null;
    createdAt: Date;
  }) {
    return {
      fileName: artifact.fileName,
      originalFileName: artifact.originalFileName,
      mimeType: artifact.mimeType,
      sizeBytes: artifact.sizeBytes,
      publicUrl: artifact.publicUrl,
      checksumSha256: artifact.checksumSha256,
      versionName: artifact.versionName,
      versionCode: artifact.versionCode,
      createdAt: artifact.createdAt,
    };
  }

  private assertValidApk(file: UploadedApkFile) {
    const maxBytes =
      this.configService.get<number>('app.maxApkUploadBytes') ??
      200 * 1024 * 1024;
    const originalName = file.originalname ?? '';
    const extension = extname(originalName).toLowerCase();
    const mimeType = file.mimetype ?? '';

    if (file.size && file.size > maxBytes) {
      throw new BadRequestException('APK file is too large');
    }

    if (extension !== '.apk') {
      throw new BadRequestException('Only .apk files are allowed');
    }

    if (
      mimeType &&
      ![
        'application/vnd.android.package-archive',
        'application/octet-stream',
        'application/zip',
      ].includes(mimeType)
    ) {
      throw new BadRequestException('Invalid APK file type');
    }
  }

  private assertValidPlayStoreUrl(value: string) {
    let url: URL;

    try {
      url = new URL(value);
    } catch {
      throw new BadRequestException('Google Play URL is invalid');
    }

    const hostname = url.hostname.toLowerCase();
    const validHostnames = new Set(['play.google.com', 'market.android.com']);

    if (url.protocol !== 'https:' || !validHostnames.has(hostname)) {
      throw new BadRequestException(
        'Google Play URL must be an HTTPS Play Store URL',
      );
    }

    if (!url.pathname.startsWith('/store/apps/details')) {
      throw new BadRequestException(
        'Google Play URL must point to an app details page',
      );
    }
  }

  private getStoragePath() {
    const storagePath = this.configService.get<string>(
      'app.downloadStoragePath',
    );

    if (!storagePath) {
      throw new NotFoundException('Download storage path is not configured');
    }

    return storagePath;
  }
}

function sanitizeFileSegment(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-zA-Z0-9.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'android'
  );
}
