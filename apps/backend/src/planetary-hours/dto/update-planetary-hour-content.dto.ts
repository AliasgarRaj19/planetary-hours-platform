import { IsInt, IsString, Max, Min } from 'class-validator';

export class UpdatePlanetaryHourContentDto {
  @IsInt()
  @Min(1)
  @Max(24)
  hourNumber!: number;

  @IsString()
  description!: string;

  @IsString()
  suggestion!: string;
}
