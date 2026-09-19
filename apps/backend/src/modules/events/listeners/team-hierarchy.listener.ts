import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { EventName } from '@boilerplate/core';
import type {
  UserManagerChangedEvent,
  UserBlockedEvent,
} from '@boilerplate/core';
import { UserEntity } from '@db/entities';
import { UserRepository } from '@db/repositories';
import { TeamScopeService } from '@shared/services/team-scope.service';

@Injectable()
export class TeamHierarchyListener {
  constructor(
    private readonly teamScopeService: TeamScopeService,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
  ) {}

  @OnEvent(EventName.USER_MANAGER_CHANGED, { async: true })
  async handleManagerChanged(event: UserManagerChangedEvent): Promise<void> {
    await this.teamScopeService.invalidateOrgTeamCache(event.organizationId);
  }

  @OnEvent(EventName.USER_BLOCKED, { async: true })
  async handleUserBlocked(event: UserBlockedEvent): Promise<void> {
    const blockedUser = await this.userRepository.findOne({
      where: { id: event.userId, organizationId: event.organizationId },
      select: ['id', 'managerId', 'path'],
    });

    if (!blockedUser) return;

    const directReports = await this.userRepository.find({
      where: { managerId: event.userId, organizationId: event.organizationId },
      select: ['id', 'path'],
    });

    if (directReports.length > 0) {
      const newManagerId = blockedUser.managerId || null;

      let newManagerPath: string | null = null;
      if (newManagerId) {
        const newManager = await this.userRepository.findOne({
          where: { id: newManagerId },
          select: ['id', 'path'],
        });
        newManagerPath = newManager?.path || `/${newManagerId}/`;
      }

      await this.dataSource.transaction(async (transactionManager) => {
        const userRepo = transactionManager.getRepository(UserEntity);

        for (const report of directReports) {
          const oldPath = report.path || `/${report.id}/`;
          let newPath: string;
          if (newManagerPath) {
            newPath = `${newManagerPath.replace(/\/$/, '')}/${report.id}/`;
          } else {
            newPath = `/${report.id}/`;
          }

          report.managerId = newManagerId;
          report.path = newPath;
          await userRepo.save(report);

          if (oldPath !== newPath) {
            await transactionManager.query(
              `UPDATE "users" SET "path" = REPLACE("path", $1, $2) WHERE "path" LIKE $3 AND "id" != $4`,
              [oldPath, newPath, `${oldPath}%`, report.id],
            );
          }
        }
      });
    }

    await this.teamScopeService.invalidateOrgTeamCache(event.organizationId);
  }
}
