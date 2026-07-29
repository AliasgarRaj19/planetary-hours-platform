import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? [];

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
