import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { AppDistributionService } from './app-distribution.service';
import { UpdateAppDistributionDto } from './dto/update-app-distribution.dto';
import { UploadApkDto } from './dto/upload-apk.dto';

@Controller()
export class AppDistributionController {
  constructor(
    private readonly appDistributionService: AppDistributionService,
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
  updateAdminAndroidDistribution(@Body() dto: UpdateAppDistributionDto) {
    return this.appDistributionService.updateAndroidDistribution(dto);
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
  ) {
    return this.appDistributionService.uploadAndroidApk(file, dto);
  }
}
