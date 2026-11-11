import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventName } from '@boilerplate/core';
import type { RoleUpdatedEvent } from '@boilerplate/core';
import { UserRepository } from '@db/repositories';

@Injectable()
export class RolePermissionListener {
  private readonly logger = new Logger(RolePermissionListener.name);

  constructor(private readonly userRepository: UserRepository) {}

  @OnEvent(EventName.ROLE_UPDATED, { async: true })
  async handleRoleUpdated(event: RoleUpdatedEvent): Promise<void> {
    if (!event.permissionsChanged) return;

    const result = await this.userRepository
      .createQueryBuilder()
      .update()
      .set({
        refreshToken: null,
        refreshTokenExpires: null,
        refreshTokenJti: null,
      })
      .where('roleId = :roleId', { roleId: event.roleId })
      .andWhere('organizationId = :organizationId', {
        organizationId: event.organizationId,
      })
      .execute();

    this.logger.log(
      `Invalidated refresh tokens for ${result.affected} users with role ${event.roleId}`,
    );
  }
}
