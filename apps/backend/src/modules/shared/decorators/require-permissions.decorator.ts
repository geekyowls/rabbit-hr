import {
  applyDecorators,
  SetMetadata,
  UseGuards,
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
export const PERMISSIONS_KEY = 'requiredPermissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const bypassPermissions = this.configService.get<string>(
      'DEV_BYPASS_PERMISSIONS',
    );
    if (bypassPermissions === 'true') {
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredPermissions && requiredPermissions.length > 0) {
        console.warn(
          `[DEV] Permission check bypassed for: [${requiredPermissions.join(', ')}]`,
        );
      }
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.permissions?.length) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const hasPermission = requiredPermissions.every((required) =>
      user.permissions.some(
        (p: string) => p === required || p.startsWith(required + ':'),
      ),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

export const RequirePermissions = (...permissions: string[]) => {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    UseGuards(JwtAuthGuard, PermissionsGuard),
    ApiBearerAuth(),
  );
};

const ANY_PERMISSIONS_KEY = 'requiredAnyPermissions';

@Injectable()
export class AnyPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.configService.get<string>('DEV_BYPASS_PERMISSIONS') === 'true') {
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
        ANY_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredPermissions && requiredPermissions.length > 0) {
        console.warn(
          `[DEV] Permission check bypassed for (any): [${requiredPermissions.join(', ')}]`,
        );
      }
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      ANY_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.permissions?.length) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const hasAny = requiredPermissions.some((required) =>
      user.permissions.some(
        (p: string) => p === required || p.startsWith(required + ':'),
      ),
    );

    if (!hasAny) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

export const RequireAnyPermission = (...permissions: string[]) => {
  return applyDecorators(
    SetMetadata(ANY_PERMISSIONS_KEY, permissions),
    UseGuards(JwtAuthGuard, AnyPermissionsGuard),
    ApiBearerAuth(),
  );
};
