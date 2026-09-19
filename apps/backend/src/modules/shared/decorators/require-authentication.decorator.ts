import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

export const RequireAuthentication = () => {
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth());
};
