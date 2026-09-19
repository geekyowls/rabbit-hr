import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export interface UserSessionData {
  userId: string;
  email: string;
  organizationId: string;
  permissions: string[];
  roleId?: string;
  jti?: string;
  impersonatedBy?: string;
  isImpersonation?: boolean;
}

export const UserSession = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSessionData => {
    const request = ctx.switchToHttp().getRequest();

    if (request.user) {
      return request.user;
    }

    Logger.error(
      'Attempted to access user session without a user in the request. Did you forget to add JwtAuthGuard?',
      'UserSession',
    );
    throw new InternalServerErrorException('User session not available');
  },
);
