import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { mailService, MailService } from '@boilerplate/core';
import { AppEventEmitter } from './services/event-emitter.service';
import { UserEmailListener } from './listeners/user-email.listener';
import { OrganizationEmailListener } from './listeners/organization-email.listener';
import { RolePermissionListener } from './listeners/role-permission.listener';
import { TeamHierarchyListener } from './listeners/team-hierarchy.listener';

const LISTENERS = [
  UserEmailListener,
  OrganizationEmailListener,
  RolePermissionListener,
  TeamHierarchyListener,
];

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  providers: [mailService, AppEventEmitter, ...LISTENERS],
  exports: [AppEventEmitter, MailService],
})
export class EventsModule {}
