import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Backward-compatible alias so both /auth/* and /api/auth/* work.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.url === '/api' || req.url.startsWith('/api/')) {
      req.url = req.url.replace(/^\/api/, '') || '/';
    }
    next();
  });

  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
