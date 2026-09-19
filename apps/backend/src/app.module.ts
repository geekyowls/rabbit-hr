import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestIdMiddleware } from './modules/shared/middleware/request-id.middleware';
import { DatabaseModule } from './database/db.module';
import { SharedModule } from './modules/shared/shared.module';
import { EventsModule } from './modules/events/events.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { AuditModule } from './modules/audit/audit.module';
import { StorageModule } from './modules/storage/storage.module';
import { IntegrationModule } from './modules/integration/integration.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { OrganizationConfigModule } from './modules/organization-config/organization-config.module';
import { SystemAdminModule } from './modules/system-admin/system-admin.module';
import { UserNotificationsModule } from './modules/user-notifications/user-notifications.module';
import { QueueModule } from './modules/queue/queue.module';
import { SessionModule } from './modules/session/session.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),
    DatabaseModule,
    SharedModule,
    EventsModule,
    AuthModule,
    UserModule,
    RoleModule,
    AuditModule,
    StorageModule,
    IntegrationModule,
    OrganizationModule,
    OrganizationConfigModule,
    SystemAdminModule,
    UserNotificationsModule,
    QueueModule,
    SessionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
