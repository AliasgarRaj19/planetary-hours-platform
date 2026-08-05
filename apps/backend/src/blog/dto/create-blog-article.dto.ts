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
  BLOG_DRAFT_STATUS,
  blogArticleStatuses,
  blogSlugPattern,
  type BlogArticleStatusValue,
} from '../blog.constants';

export class CreateBlogArticleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(180)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @Matches(blogSlugPattern)
  slug!: string;

  @IsString()
  @MaxLength(500)
  excerpt!: string;

  @IsString()
  @MaxLength(50000)
  bodyMarkdown!: string;

  @IsOptional()
  @IsIn(blogArticleStatuses)
  status?: BlogArticleStatusValue = BLOG_DRAFT_STATUS;

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
