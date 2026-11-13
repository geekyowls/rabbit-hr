import './instrument';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './modules/shared/framework/response.interceptor';
import { LoggingInterceptor } from './modules/shared/framework/logging.interceptor';
import { JsonLogger } from './modules/shared/framework/json-logger';
import { AuditInterceptor } from './modules/shared/framework/audit.interceptor';
import { GlobalExceptionFilter } from './modules/shared/filters/global-exception.filter';
import { assertProductionEnv } from './modules/shared/framework/production-env';
import helmet from 'helmet';
import * as express from 'express';

function parseTrustProxy(value: string | undefined): boolean | number | string {
  if (!value || value === 'true') return true;
  if (value === 'false') return false;
  const hops = Number(value);
  return Number.isInteger(hops) ? hops : value;
}

async function bootstrap() {
  assertProductionEnv('api');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger:
      process.env.NODE_ENV === 'production' ? new JsonLogger() : undefined,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  const isDev = process.env.NODE_ENV !== 'production';

  const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL)
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const PUBLIC_CORS_PATH_PREFIXES: string[] = ['/api/v1/public/'];
  const isPublicCorsPath = (path: string) =>
    PUBLIC_CORS_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

  expressApp.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (!isPublicCorsPath(req.path)) return next();
      const origin = req.headers.origin;
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        (req.headers['access-control-request-headers'] as string) ||
          'Content-Type, Accept, Origin, X-Requested-With',
      );
      res.setHeader('Access-Control-Max-Age', '86400');
      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      return next();
    },
  );

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: isDev
            ? ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net']
            : ["'self'", "'unsafe-inline'"],
          scriptSrc: isDev
            ? [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                'https://cdn.jsdelivr.net',
              ]
            : ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", ...(corsOrigins || [])],
          fontSrc: ["'self'", 'https:', 'data:', 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: isDev ? null : [],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: isDev
        ? false
        : {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
    }),
  );

  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:4000',
  ];

  app.enableCors({
    origin: isDev ? devOrigins : corsOrigins || [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Organization-ID',
      'CF-Connecting-IP',
      'CF-Ray',
    ],
    exposedHeaders: ['Content-Disposition'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      forbidUnknownValues: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Register global interceptors and filters
  const auditInterceptor = app.get(AuditInterceptor);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
    auditInterceptor,
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('RabbitHR API')
      .setDescription('RabbitHR API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: 'RabbitHR API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
      customfavIcon: '/favicon.ico',
      customJs: [
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js',
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js',
      ],
      customCssUrl:
        'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css',
    });
  }

  const isSmokeTest = process.env.API_SMOKE_TEST === '1';
  const port = Number(process.env.PORT || 4000);

  // Listen on 0.0.0.0 to accept connections from outside the container
  await app.listen(port, '0.0.0.0');

  console.log(
    `API listening on http://0.0.0.0:${port}${isDev ? ' (Swagger: /api/docs)' : ''}`,
  );

  if (isSmokeTest) {
    console.log(
      'API smoke test mode enabled – shutting down after successful boot.',
    );
    await app.close();
    process.exit(0);
  }
}
void bootstrap();
