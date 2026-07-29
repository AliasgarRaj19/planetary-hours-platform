import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PlanetaryHoursRepository } from './planetary-hours.repository';
import { PlanetaryHoursService } from './planetary-hours.service';

describe('PlanetaryHoursService', () => {
  let service: PlanetaryHoursService;
  const repository = {
    findByDay: jest.fn(),
    updateDay: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanetaryHoursService,
        {
          provide: PlanetaryHoursRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(PlanetaryHoursService);
    jest.clearAllMocks();
  });

  it('rejects an invalid day', () => {
    expect(() => service.getDayContent(8)).toThrow(BadRequestException);
  });

  it('rejects duplicate hour numbers', () => {
    const payload = Array.from({ length: 24 }, (_, index) => ({
      hourNumber: index === 23 ? 1 : index + 1,
      description: '',
      suggestion: '',
    }));

    expect(() => service.updateDayContent(1, payload)).toThrow(
      BadRequestException,
    );
  });

  it('rejects payloads that do not contain exactly 24 records', () => {
    expect(() => service.updateDayContent(1, [])).toThrow(BadRequestException);
  });
});
