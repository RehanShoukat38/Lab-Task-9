import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers via Helmet
  app.use(helmet());

  // 2. Restrict CORS to http://localhost:5173 only
  app.enableCors({
    origin: 'http://localhost:5173',
  });

  // 3. Register global ValidationPipe with whitelist, forbidNonWhitelisted and transform
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running securely on http://localhost:${port}`);
}

bootstrap();
