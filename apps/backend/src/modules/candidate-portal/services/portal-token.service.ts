import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { CandidatePortalSessionRepository } from '@db/repositories';
import {
  PORTAL_ACCESS_TOKEN_TYPE,
  PORTAL_REFRESH_TOKEN_TYPE,
  PORTAL_TOKEN_AUDIENCE,
  portalTokenExpiresIn,
  portalTokenSecret,
} from './portal-token.config';

export interface PortalTokenPayload {
  candidateId: string;
  organizationId: string;
  email: string;
  typ: string;
  jti?: string;
}

export interface PortalTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PortalSessionMeta {
  userAgent?: string | null;
  ipAddress?: string | null;
}

interface PortalIdentity {
  id: string;
  organizationId: string;
  email: string;
}

@Injectable()
export class PortalTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessionRepository: CandidatePortalSessionRepository,
  ) {}

  async issue(
    candidate: PortalIdentity,
    meta: PortalSessionMeta,
  ): Promise<PortalTokenPair> {
    const jti = randomUUID();
    const base = {
      candidateId: candidate.id,
      organizationId: candidate.organizationId,
      email: candidate.email,
    };
    const accessToken = this.jwtService.sign(
      { ...base, typ: PORTAL_ACCESS_TOKEN_TYPE },
      {
        secret: portalTokenSecret(this.config, 'access'),
        expiresIn: portalTokenExpiresIn(this.config, 'access'),
        audience: PORTAL_TOKEN_AUDIENCE,
      },
    );
    const refreshToken = this.jwtService.sign(
      { ...base, typ: PORTAL_REFRESH_TOKEN_TYPE, jti },
      {
        secret: portalTokenSecret(this.config, 'refresh'),
        expiresIn: portalTokenExpiresIn(this.config, 'refresh'),
        audience: PORTAL_TOKEN_AUDIENCE,
      },
    );
    const decoded = this.jwtService.decode<{ exp: number }>(refreshToken);
    await this.sessionRepository.save(
      this.sessionRepository.create({
        organizationId: candidate.organizationId,
        candidateId: candidate.id,
        jti,
        expiresAt: new Date(decoded.exp * 1000),
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
        lastUsedAt: new Date(),
        revokedAt: null,
      }),
    );
    return { accessToken, refreshToken };
  }

  verifyAccess(token: string): PortalTokenPayload {
    return this.verify(token, 'access', PORTAL_ACCESS_TOKEN_TYPE);
  }

  verifyRefresh(token: string): PortalTokenPayload {
    const payload = this.verify(token, 'refresh', PORTAL_REFRESH_TOKEN_TYPE);
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid session');
    }
    return payload;
  }

  private verify(
    token: string,
    kind: 'access' | 'refresh',
    type: string,
  ): PortalTokenPayload {
    let payload: PortalTokenPayload;
    try {
      payload = this.jwtService.verify<PortalTokenPayload>(token, {
        secret: portalTokenSecret(this.config, kind),
        audience: PORTAL_TOKEN_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
    if (
      payload.typ !== type ||
      !payload.candidateId ||
      !payload.organizationId
    ) {
      throw new UnauthorizedException('Invalid session');
    }
    return payload;
  }
}
