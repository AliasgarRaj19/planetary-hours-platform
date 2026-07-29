import { BadRequestException, Injectable } from '@nestjs/common';
import type { UpdatePlanetaryHourContentDto } from './dto/update-planetary-hour-content.dto';
import { PlanetaryHoursRepository } from './planetary-hours.repository';

const DAYS_PER_WEEK = 7;
const HOURS_PER_DAY = 24;

@Injectable()
export class PlanetaryHoursService {
  constructor(private readonly repository: PlanetaryHoursRepository) {}

  getDayContent(dayOfWeek: number) {
    this.assertValidDay(dayOfWeek);
    return this.repository.findByDay(dayOfWeek);
  }

  updateDayContent(
    dayOfWeek: number,
    records: UpdatePlanetaryHourContentDto[],
  ) {
    this.assertValidDay(dayOfWeek);
    this.assertValidDayPayload(records);
    return this.repository.updateDay(dayOfWeek, records);
  }

  private assertValidDay(dayOfWeek: number) {
    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > DAYS_PER_WEEK
    ) {
      throw new BadRequestException('dayOfWeek must be an integer from 1 to 7');
    }
  }

  private assertValidDayPayload(records: UpdatePlanetaryHourContentDto[]) {
    if (records.length !== HOURS_PER_DAY) {
      throw new BadRequestException('Exactly 24 hourly records are required');
    }

    const hourNumbers = new Set<number>();

    for (const record of records) {
      if (hourNumbers.has(record.hourNumber)) {
        throw new BadRequestException('Duplicate hour numbers are not allowed');
      }

      hourNumbers.add(record.hourNumber);
    }
  }
}
