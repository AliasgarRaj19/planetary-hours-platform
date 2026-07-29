import type { PrismaService } from './prisma.service';

export const DAYS_PER_WEEK = 7;
export const HOURS_PER_DAY = 24;
export const PLANETARY_HOUR_CONTENT_RECORD_COUNT =
  DAYS_PER_WEEK * HOURS_PER_DAY;

type PlanetaryHourContentDelegate = Pick<
  PrismaService['planetaryHourContent'],
  'count' | 'deleteMany' | 'upsert'
>;

export async function seedPlanetaryHourContent(
  planetaryHourContent: PlanetaryHourContentDelegate,
) {
  await planetaryHourContent.deleteMany({
    where: {
      OR: [
        { dayOfWeek: { lt: 1 } },
        { dayOfWeek: { gt: DAYS_PER_WEEK } },
        { hourNumber: { lt: 1 } },
        { hourNumber: { gt: HOURS_PER_DAY } },
      ],
    },
  });

  for (let dayOfWeek = 1; dayOfWeek <= DAYS_PER_WEEK; dayOfWeek += 1) {
    for (let hourNumber = 1; hourNumber <= HOURS_PER_DAY; hourNumber += 1) {
      await planetaryHourContent.upsert({
        where: {
          dayOfWeek_hourNumber: {
            dayOfWeek,
            hourNumber,
          },
        },
        update: {},
        create: {
          dayOfWeek,
          hourNumber,
          description: '',
          suggestion: '',
        },
      });
    }
  }

  return planetaryHourContent.count();
}
