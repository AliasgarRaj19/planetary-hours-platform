import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ANDROID_PLATFORM,
  CURRENT_APK_URL,
  DIRECT_APK_MODE,
  GOOGLE_PLAY_MODE,
} from './app-distribution.constants';

type AppDistributionModeInput =
  typeof DIRECT_APK_MODE | typeof GOOGLE_PLAY_MODE;

@Injectable()
export class AppDistributionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAndroidDistribution() {
    return this.prisma.appDistribution.findUnique({
      where: { platform: ANDROID_PLATFORM },
      include: {
        artifacts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  ensureAndroidDistribution() {
    return this.prisma.appDistribution.upsert({
      where: { platform: ANDROID_PLATFORM },
      update: {},
      create: {
        platform: ANDROID_PLATFORM,
        activeMode: DIRECT_APK_MODE,
        isEnabled: true,
        artifacts: {
          create: {
            fileName: 'planetary-hours-1.0.3-build6.apk',
            originalFileName: 'planetary-hours-1.0.3-build6.apk',
            mimeType: 'application/vnd.android.package-archive',
            sizeBytes: 0,
            storagePath: '',
            publicUrl: CURRENT_APK_URL,
            checksumSha256: '',
            versionName: '1.0.3',
            versionCode: 6,
          },
        },
      },
      include: {
        artifacts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  updateAndroidDistribution(input: {
    activeMode?: AppDistributionModeInput;
    isEnabled?: boolean;
    storeUrl?: string | null;
  }) {
    return this.prisma.appDistribution.update({
      where: { platform: ANDROID_PLATFORM },
      data: input,
      include: {
        artifacts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async createAndroidArtifact(input: {
    fileName: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    storagePath: string;
    publicUrl: string;
    checksumSha256: string;
    versionName?: string;
    versionCode?: number;
  }) {
    const distribution = await this.ensureAndroidDistribution();

    return this.prisma.appDistributionArtifact.create({
      data: {
        distributionId: distribution.id,
        ...input,
      },
    });
  }
}
