import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MAX_BLOG_PAGE_SIZE, blogSlugPattern } from '../blog.constants';

export class BlogArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_BLOG_PAGE_SIZE)
  pageSize?: number;

  @IsOptional()
  @IsString()
  @Matches(blogSlugPattern)
  category?: string;
}
