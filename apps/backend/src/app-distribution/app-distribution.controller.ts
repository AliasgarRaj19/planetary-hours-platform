import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AuditService } from '../audit/audit.service';
import { getAuditContextFromRequest } from '../audit/types/audit-context';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AppDistributionService } from './app-distribution.service';
import { UpdateAppDistributionDto } from './dto/update-app-distribution.dto';
import { UploadApkDto } from './dto/upload-apk.dto';

@Controller()
export class AppDistributionController {
  constructor(
    private readonly appDistributionService: AppDistributionService,
    private readonly auditService: AuditService,
  ) {}

  @Get('app-distribution/android')
  getPublicAndroidDistribution() {
    return this.appDistributionService.getPublicAndroidDistribution();
  }

  @Get('app-distribution/android/download')
  async downloadAndroid(@Res() response: Response) {
    const target = await this.appDistributionService.getAndroidDownloadTarget();

    if (target.type === 'redirect') {
      return response.redirect(302, target.url);
    }

    return response.download(target.filePath, target.fileName);
  }

  @Get('admin/app-distribution/android')
  @UseGuards(AdminJwtGuard)
  getAdminAndroidDistribution() {
    return this.appDistributionService.getAdminAndroidDistribution();
  }

  @Put('admin/app-distribution/android')
  @UseGuards(AdminJwtGuard)
  async updateAdminAndroidDistribution(
    @Body() dto: UpdateAppDistributionDto,
    @Req() request: Request,
  ) {
    const distribution =
      await this.appDistributionService.updateAndroidDistribution(dto);

    await this.auditService.record({
      action: 'app_distribution.settings_update',
      module: 'app_distribution',
      resourceType: 'android_distribution',
      resourceId: distribution.platform,
      resourceDisplayName: 'Android app distribution',
      description: 'Android app distribution settings were updated.',
      context: getAuditContextFromRequest(request),
      metadata: {
        activeMode: distribution.activeMode,
        isEnabled: distribution.isEnabled,
        hasStoreUrl: Boolean(distribution.storeUrl),
      },
    });

    return distribution;
  }

  @Post('admin/app-distribution/android/apk')
  @UseGuards(AdminJwtGuard)
  @UseInterceptors(
    FileInterceptor('apk', {
      limits: {
        fileSize: 200 * 1024 * 1024,
      },
    }),
  )
  uploadAndroidApk(
    @UploadedFile()
    file: {
      buffer?: Buffer;
      mimetype?: string;
      originalname?: string;
      size?: number;
    },
    @Body() dto: UploadApkDto,
    @Req() request: Request,
  ) {
    return this.appDistributionService
      .uploadAndroidApk(file, dto)
      .then(async (result) => {
        await this.auditService.record({
          action: 'app_distribution.apk_upload',
          module: 'app_distribution',
          resourceType: 'android_apk',
          resourceId: result.artifact.fileName,
          resourceDisplayName: result.artifact.fileName,
          description: 'A replacement Android APK was uploaded.',
          context: getAuditContextFromRequest(request),
          metadata: {
            fileName: result.artifact.fileName,
            originalFileName: result.artifact.originalFileName,
            versionName: result.artifact.versionName,
            versionCode: result.artifact.versionCode,
            sizeBytes: result.artifact.sizeBytes,
            sha256: result.artifact.checksumSha256,
          },
        });

        return result;
      });
  }
}
