import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventName, UserManagerChangedEvent } from '@boilerplate/core';
import { AppEventEmitter } from '@modules/events/services/event-emitter.service';
import { UserEntity } from '@db/entities';
import { SetManagerCommand } from './set-manager.command';

@Injectable()
export class SetManager {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: AppEventEmitter,
  ) {}

  async execute(command: SetManagerCommand) {
    const { targetUserId, managerId, organizationId, userId } = command;

    if (managerId && targetUserId === managerId) {
      throw new BadRequestException('A user cannot be their own manager');
    }

    const result = await this.dataSource.transaction(
      async (transactionManager) => {
        const userRepo = transactionManager.getRepository(UserEntity);

        const targetUser = await userRepo.findOne({
          where: { id: targetUserId, organizationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!targetUser) {
          throw new NotFoundException('User not found');
        }

        const previousManagerId = targetUser.managerId;

        let manager: UserEntity | null = null;
        if (managerId) {
          manager = await userRepo.findOne({
            where: { id: managerId, organizationId },
            lock: { mode: 'pessimistic_write' },
          });

          if (!manager) {
            throw new NotFoundException('Manager not found');
          }

          const managerPath = manager.path || `/${managerId}/`;
          if (managerPath.includes(`/${targetUserId}/`)) {
            throw new BadRequestException(
              'Cannot set manager: this would create a circular reference',
            );
          }
        }

        const oldPath = targetUser.path || `/${targetUserId}/`;

        let newPath: string;
        if (manager) {
          const managerPath = manager.path || `/${managerId}/`;
          newPath = `${managerPath.replace(/\/$/, '')}/${targetUserId}/`;
        } else {
          newPath = `/${targetUserId}/`;
        }

        targetUser.managerId = managerId;
        targetUser.path = newPath;
        await userRepo.save(targetUser);

        if (oldPath !== newPath) {
          await transactionManager.query(
            `UPDATE "users" SET "path" = REPLACE("path", $1, $2) WHERE "path" LIKE $3 AND "id" != $4 AND "organizationId" = $5`,
            [oldPath, newPath, `${oldPath}%`, targetUserId, organizationId],
          );
        }

        return { previousManagerId };
      },
    );

    this.eventEmitter.emit<UserManagerChangedEvent>({
      eventName: EventName.USER_MANAGER_CHANGED,
      timestamp: new Date(),
      userId: targetUserId,
      organizationId,
      previousManagerId: result.previousManagerId,
      newManagerId: managerId,
      triggeredBy: userId,
    });

    return { success: true };
  }
}
