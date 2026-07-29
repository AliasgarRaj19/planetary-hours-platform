import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { PlanetaryHoursController } from './planetary-hours.controller';
import { PlanetaryHoursRepository } from './planetary-hours.repository';
import { PlanetaryHoursService } from './planetary-hours.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PlanetaryHoursController],
  providers: [PlanetaryHoursRepository, PlanetaryHoursService],
})
export class PlanetaryHoursModule {}
