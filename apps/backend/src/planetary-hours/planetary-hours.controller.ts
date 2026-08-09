import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuditService } from '../audit/audit.service';
import { getAuditContextFromRequest } from '../audit/types/audit-context';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { UpdatePlanetaryHourContentDto } from './dto/update-planetary-hour-content.dto';
import { PlanetaryHoursService } from './planetary-hours.service';

@Controller('planetary-hours')
export class PlanetaryHoursController {
  constructor(
    private readonly planetaryHoursService: PlanetaryHoursService,
    private readonly auditService: AuditService,
  ) {}

  @Get(':dayOfWeek')
  getDayContent(@Param('dayOfWeek', ParseIntPipe) dayOfWeek: number) {
    return this.planetaryHoursService.getDayContent(dayOfWeek);
  }

  @Put(':dayOfWeek')
  @UseGuards(AdminJwtGuard)
  updateDayContent(
    @Param('dayOfWeek', ParseIntPipe) dayOfWeek: number,
    @Body(new ParseArrayPipe({ items: UpdatePlanetaryHourContentDto }))
    records: UpdatePlanetaryHourContentDto[],
    @Req() request: Request,
  ) {
    return this.planetaryHoursService
      .updateDayContent(dayOfWeek, records)
      .then(async (updatedRecords) => {
        await this.auditService.record({
          action: 'planetary_hours.day_content_update',
          module: 'planetary_hours',
          resourceType: 'planetary_hour_day',
          resourceId: dayOfWeek,
          resourceDisplayName: `Day ${dayOfWeek}`,
          description: `Planetary hour content for day ${dayOfWeek} was updated.`,
          context: getAuditContextFromRequest(request),
          metadata: {
            dayOfWeek,
            changedRows: records.length,
          },
        });

        return updatedRecords;
      });
  }
}
