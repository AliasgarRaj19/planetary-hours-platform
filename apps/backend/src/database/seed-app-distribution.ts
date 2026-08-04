import type { PrismaService } from './prisma.service';
import {
  ANDROID_PLATFORM,
  CURRENT_APK_URL,
  DIRECT_APK_MODE,
} from '../app-distribution/app-distribution.constants';

type AppDistributionDelegate = Pick<
  PrismaService['appDistribution'],
  'findUnique' | 'upsert'
>;

type AppDistributionArtifactDelegate = Pick<
  PrismaService['appDistributionArtifact'],
  'count' | 'create'
>;

export async function seedAppDistribution(
  appDistribution: AppDistributionDelegate,
  appDistributionArtifact: AppDistributionArtifactDelegate,
) {
  const distribution = await appDistribution.upsert({
    where: { platform: ANDROID_PLATFORM },
    update: {},
    create: {
      platform: ANDROID_PLATFORM,
      activeMode: DIRECT_APK_MODE,
      isEnabled: true,
    },
  });
  const artifactCount = await appDistributionArtifact.count({
    where: { distributionId: distribution.id },
  });

  if (artifactCount === 0) {
    await appDistributionArtifact.create({
      data: {
        distributionId: distribution.id,
        fileName: 'planetary-hours-1.0.3-build6.apk',
        originalFileName: 'planetary-hours-1.0.3-build6.apk',
        mimeType: 'application/vnd.android.package-archive',
        sizeBytes: 0,
        storagePath: '',
        publicUrl: CURRENT_APK_URL,
        checksumSha256: '',
        versionName: '1.0.3',
        versionCode: 7,
      },
    });
  }
}
