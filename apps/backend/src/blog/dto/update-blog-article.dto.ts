import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  blogArticleStatuses,
  blogSlugPattern,
  type BlogArticleStatusValue,
} from '../blog.constants';

export class UpdateBlogArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @Matches(blogSlugPattern)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  bodyMarkdown?: string;

  @IsOptional()
  @IsIn(blogArticleStatuses)
  status?: BlogArticleStatusValue;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  seoDescription?: string | null;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  categoryIds?: number[];
}
