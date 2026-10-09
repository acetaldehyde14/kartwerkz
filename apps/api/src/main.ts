import 'reflect-metadata';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

// Read at runtime (not a static TS import) so `rootDir: ./src` is not
// violated by reaching one level up to apps/api/package.json.
function readApiVersion(): string {
  try {
    const raw = readFileSync(join(__dirname, '..', 'package.json'), 'utf-8');
    return (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

async function bootstrap(): Promise<void> {
  // rawBody: true preserves the exact request bytes on req.rawBody, needed
  // by WebhooksController to verify the Stripe signature — a re-serialized
  // JSON body would not match the signature Stripe computed.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser(config.get<string>('SESSION_SECRET')));

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN'),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Health check is intentionally included under the v1 prefix so the
  // docker-compose healthcheck (GET /api/v1/health) matches the rest of
  // the API surface rather than needing a separate unversioned exception.
  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kartwerkz API')
    .setDescription('Kartwerkz — self-hosted custom karting graphics ecommerce platform')
    .setVersion(readApiVersion())
    .addCookieAuth('kw_session')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('API_PORT', 4000);
  await app.listen(port);
  Logger.log(`Kartwerkz API listening on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap', err);
  process.exit(1);
});
