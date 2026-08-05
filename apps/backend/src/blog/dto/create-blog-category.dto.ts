import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { blogSlugPattern } from '../blog.constants';

export class CreateBlogCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(blogSlugPattern)
  slug!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  seoDescription?: string | null;
}
