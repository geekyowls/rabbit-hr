import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

import { OrganizationRepository } from '@db/repositories';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.organizationId) {
      throw new ForbiddenException('Access denied');
    }

    const organization = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
    });

    if (!organization?.isSystemOrg) {
      throw new ForbiddenException(
        'Access denied. Only system administrators can access this resource.',
      );
    }

    return true;
  }
}
