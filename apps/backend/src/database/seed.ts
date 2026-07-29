import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import {
  PLANETARY_HOUR_CONTENT_RECORD_COUNT,
  seedPlanetaryHourContent,
} from './seed-planetary-hour-content';

async function main() {
  const configService = new ConfigService({
    DATABASE_URL: process.env.DATABASE_URL,
    database: {
      url: process.env.DATABASE_URL,
    },
  });
  const prisma = new PrismaService(configService);

  try {
    const recordCount = await seedPlanetaryHourContent(
      prisma.planetaryHourContent,
    );

    if (recordCount !== PLANETARY_HOUR_CONTENT_RECORD_COUNT) {
      throw new Error(
        `Expected ${PLANETARY_HOUR_CONTENT_RECORD_COUNT} planetary-hour content records, found ${recordCount}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main();
