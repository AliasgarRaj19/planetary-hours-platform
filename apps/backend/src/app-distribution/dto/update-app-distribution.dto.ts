import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  DIRECT_APK_MODE,
  GOOGLE_PLAY_MODE,
} from '../app-distribution.constants';

export class UpdateAppDistributionDto {
  @IsOptional()
  @IsIn([DIRECT_APK_MODE, GOOGLE_PLAY_MODE])
  activeMode?: typeof DIRECT_APK_MODE | typeof GOOGLE_PLAY_MODE;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storeUrl?: string | null;
}
