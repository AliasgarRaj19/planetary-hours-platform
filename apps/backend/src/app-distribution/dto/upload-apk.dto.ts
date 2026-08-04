import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadApkDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  versionName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  versionCode?: number;
}
