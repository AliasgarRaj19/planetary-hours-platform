import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../auth/admin-jwt.guard';
import { UpdatePlanetaryHourContentDto } from './dto/update-planetary-hour-content.dto';
import { PlanetaryHoursService } from './planetary-hours.service';

@Controller('planetary-hours')
export class PlanetaryHoursController {
  constructor(private readonly planetaryHoursService: PlanetaryHoursService) {}

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
  ) {
    return this.planetaryHoursService.updateDayContent(dayOfWeek, records);
  }
}
