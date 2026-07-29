import {
  PLANETARY_HOUR_CONTENT_RECORD_COUNT,
  seedPlanetaryHourContent,
} from './seed-planetary-hour-content';

type SeedRecord = {
  dayOfWeek: number;
  hourNumber: number;
  description: string;
  suggestion: string;
};

function createDelegate(records: SeedRecord[]) {
  return {
    count: jest.fn(() => Promise.resolve(records.length)),
    deleteMany: jest.fn(() => {
      const validRecords = records.filter(
        (record) =>
          record.dayOfWeek >= 1 &&
          record.dayOfWeek <= 7 &&
          record.hourNumber >= 1 &&
          record.hourNumber <= 24,
      );

      records.splice(0, records.length, ...validRecords);
      return Promise.resolve({ count: 0 });
    }),
    upsert: jest.fn((args: UpsertArgs) => {
      const existingRecord = records.find(
        (record) =>
          record.dayOfWeek === args.where.dayOfWeek_hourNumber.dayOfWeek &&
          record.hourNumber === args.where.dayOfWeek_hourNumber.hourNumber,
      );

      if (existingRecord) {
        return Promise.resolve(existingRecord);
      }

      records.push(args.create);
      return Promise.resolve(args.create);
    }),
  };
}

type UpsertArgs = {
  where: {
    dayOfWeek_hourNumber: {
      dayOfWeek: number;
      hourNumber: number;
    };
  };
  create: SeedRecord;
};

describe('seedPlanetaryHourContent', () => {
  it('is idempotent and ensures 168 records', async () => {
    const records: SeedRecord[] = [];
    const delegate = createDelegate(records);

    await seedPlanetaryHourContent(
      delegate as Parameters<typeof seedPlanetaryHourContent>[0],
    );
    await seedPlanetaryHourContent(
      delegate as Parameters<typeof seedPlanetaryHourContent>[0],
    );

    expect(records).toHaveLength(PLANETARY_HOUR_CONTENT_RECORD_COUNT);
    expect(delegate.upsert).toHaveBeenCalledTimes(
      PLANETARY_HOUR_CONTENT_RECORD_COUNT * 2,
    );
    expect(
      new Set(
        records.map((record) => `${record.dayOfWeek}-${record.hourNumber}`),
      ).size,
    ).toBe(PLANETARY_HOUR_CONTENT_RECORD_COUNT);
  });
});
