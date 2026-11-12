import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { CandidateRepository } from '@db/repositories';
import { resolveAtsSettings } from '@db/entities';
import { OrganizationStatus } from '@db/enums';
import { PortalTokenService } from '../services/portal-token.service';
import type { PortalCandidateSession } from '../decorators/portal-candidate.decorator';

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

@Injectable()
export class CandidatePortalGuard implements CanActivate {
  constructor(
    private readonly tokenService: PortalTokenService,
    private readonly candidateRepository: CandidateRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { portalCandidate?: PortalCandidateSession }>();
    const token = bearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Sign in to continue');
    }
    const payload = this.tokenService.verifyAccess(token);
    const candidate = await this.candidateRepository
      .createQueryBuilder('candidate')
      .innerJoin('candidate.organization', 'organization')
      .select(['candidate.id', 'candidate.organizationId', 'candidate.email'])
      .addSelect([
        'organization.id',
        'organization.status',
        'organization.atsSettings',
      ])
      .where('candidate.id = :candidateId', {
        candidateId: payload.candidateId,
      })
      .andWhere('candidate.organizationId = :organizationId', {
        organizationId: payload.organizationId,
      })
      .getOne();
    if (
      !candidate ||
      candidate.organization.status !== OrganizationStatus.ACTIVE ||
      !resolveAtsSettings(candidate.organization.atsSettings).portalEnabled
    ) {
      throw new UnauthorizedException('Invalid session');
    }
    request.portalCandidate = {
      candidateId: candidate.id,
      organizationId: candidate.organizationId,
      email: candidate.email,
    };
    return true;
  }
}
