import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminBlogController } from './admin-blog.controller';
import { BlogController } from './blog.controller';
import { BlogRepository } from './blog.repository';
import { BlogService } from './blog.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BlogController, AdminBlogController],
  providers: [BlogRepository, BlogService],
  exports: [BlogService],
})
export class BlogModule {}
