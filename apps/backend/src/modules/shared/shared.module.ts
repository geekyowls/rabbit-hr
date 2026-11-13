import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  aiService,
  cacheManagerProvider,
  redisCacheService,
} from '@boilerplate/core';

// Services
import { TeamScopeService } from './services/team-scope.service';
import { DiscordNotifierService } from './services/discord-notifier.service';
import { PipelineStageService } from './services/pipeline-stage.service';
import { AtsSettingsService } from './services/ats-settings.service';
import { CustomFieldValidator } from './services/custom-field-validator.service';
import { ApplicationStageMover } from './services/application-stage-mover.service';
import { PortalAvailabilityService } from './services/portal-availability.service';

// Interceptors & Middleware
import { ResponseInterceptor } from './framework/response.interceptor';
import { AuditInterceptor } from './framework/audit.interceptor';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

// Filters
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import {
  PermissionsGuard,
  AnyPermissionsGuard,
} from './decorators/require-permissions.decorator';

const SHARED_PROVIDERS = [
  aiService,
  cacheManagerProvider,
  redisCacheService,
  TeamScopeService,
  DiscordNotifierService,
  PipelineStageService,
  AtsSettingsService,
  CustomFieldValidator,
  ApplicationStageMover,
  PortalAvailabilityService,
  ResponseInterceptor,
  AuditInterceptor,
  RequestIdMiddleware,
  GlobalExceptionFilter,
  PermissionsGuard,
  AnyPermissionsGuard,
];

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const accessSecret = configService.get<string>('JWT_ACCESS_SECRET');
        if (!accessSecret) {
          throw new Error(
            'JWT_ACCESS_SECRET is not defined in environment variables',
          );
        }
        return {
          secret: accessSecret,
          signOptions: {
            expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN') ?? '1h',
          },
        };
      },
    }),
  ],
  providers: [...SHARED_PROVIDERS],
  exports: [...SHARED_PROVIDERS, JwtModule],
})
export class SharedModule {}
