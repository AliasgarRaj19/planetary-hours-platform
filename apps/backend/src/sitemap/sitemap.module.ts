import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { SitemapController } from './sitemap.controller';

@Module({
  imports: [BlogModule],
  controllers: [SitemapController],
})
export class SitemapModule {}
