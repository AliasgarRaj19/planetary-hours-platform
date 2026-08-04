import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AppDistributionController } from './app-distribution.controller';
import { AppDistributionRepository } from './app-distribution.repository';
import { AppDistributionService } from './app-distribution.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppDistributionController],
  providers: [AppDistributionRepository, AppDistributionService],
})
export class AppDistributionModule {}
