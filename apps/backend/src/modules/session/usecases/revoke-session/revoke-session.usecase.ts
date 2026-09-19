import { Injectable, NotFoundException } from '@nestjs/common';
import { UserSessionRepository } from '@db/repositories';
import { RevokeSessionCommand } from './revoke-session.command';

@Injectable()
export class RevokeSession {
  constructor(private readonly userSessionRepository: UserSessionRepository) {}

  async execute(command: RevokeSessionCommand): Promise<void> {
    const revoked = await this.userSessionRepository.revokeByIdForOrganization(
      command.sessionId,
      command.organizationId,
    );

    if (!revoked) {
      throw new NotFoundException('Session not found or already revoked');
    }
  }
}
