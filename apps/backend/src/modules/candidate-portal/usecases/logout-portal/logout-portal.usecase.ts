import { Injectable } from '@nestjs/common';
import { CandidatePortalSessionRepository } from '@db/repositories';
import { PortalTokenService } from '../../services/portal-token.service';
import { RefreshPortalSessionCommand } from '../refresh-portal-session/refresh-portal-session.command';

@Injectable()
export class LogoutPortal {
  constructor(
    private readonly tokenService: PortalTokenService,
    private readonly sessionRepository: CandidatePortalSessionRepository,
  ) {}

  async execute(command: RefreshPortalSessionCommand) {
    try {
      const payload = this.tokenService.verifyRefresh(command.refreshToken);
      await this.sessionRepository.revokeByJti(payload.jti!);
    } catch {
      return { success: true };
    }
    return { success: true };
  }
}
