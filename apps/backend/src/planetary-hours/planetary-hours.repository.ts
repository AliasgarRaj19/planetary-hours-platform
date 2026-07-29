import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { UpdatePlanetaryHourContentDto } from './dto/update-planetary-hour-content.dto';

@Injectable()
export class PlanetaryHoursRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByDay(dayOfWeek: number) {
    return this.prisma.planetaryHourContent.findMany({
      where: { dayOfWeek },
      orderBy: { hourNumber: 'asc' },
    });
  }

  async updateDay(dayOfWeek: number, records: UpdatePlanetaryHourContentDto[]) {
    await this.prisma.$transaction(
      records.map((record) =>
        this.prisma.planetaryHourContent.upsert({
          where: {
            dayOfWeek_hourNumber: {
              dayOfWeek,
              hourNumber: record.hourNumber,
            },
          },
          update: {
            description: record.description,
            suggestion: record.suggestion,
          },
          create: {
            dayOfWeek,
            hourNumber: record.hourNumber,
            description: record.description,
            suggestion: record.suggestion,
          },
        }),
      ),
    );

    return this.findByDay(dayOfWeek);
  }
}
