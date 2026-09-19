import { Injectable } from '@nestjs/common';
import { UserSessionRepository } from '@db/repositories';
import { SessionResponseDto } from '../../dtos/session-response.dto';
import { ListSessionsCommand } from './list-sessions.command';

@Injectable()
export class ListSessions {
  constructor(private readonly userSessionRepository: UserSessionRepository) {}

  async execute(command: ListSessionsCommand): Promise<SessionResponseDto[]> {
    const sessions = await this.userSessionRepository.findActiveForOrganization(
      command.organizationId,
    );

    return sessions.map((session) => {
      const name = [session.user?.firstName, session.user?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        id: session.id,
        userId: session.userId,
        userName: name || session.user?.email || 'Unknown',
        userEmail: session.user?.email ?? '',
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        lastUsedAt: session.lastUsedAt,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      };
    });
  }
}
