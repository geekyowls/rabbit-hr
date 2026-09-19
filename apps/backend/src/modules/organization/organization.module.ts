import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { OrganizationController } from './organization.controller';
import { GetOrganization } from './usecases/get-organization';
import { UpdateOrganization } from './usecases/update-organization';

@Module({
  imports: [AuthModule],
  controllers: [OrganizationController],
  providers: [GetOrganization, UpdateOrganization],
})
export class OrganizationModule {}
