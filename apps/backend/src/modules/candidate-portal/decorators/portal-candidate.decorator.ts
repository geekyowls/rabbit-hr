import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CandidatePortalGuard } from '../guards/candidate-portal.guard';

export interface PortalCandidateSession {
  candidateId: string;
  organizationId: string;
  email: string;
}

export const RequireCandidatePortal = () =>
  applyDecorators(UseGuards(CandidatePortalGuard), ApiBearerAuth());

export const PortalCandidate = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PortalCandidateSession => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.portalCandidate) {
      throw new InternalServerErrorException('Portal session not available');
    }
    return request.portalCandidate;
  },
);
