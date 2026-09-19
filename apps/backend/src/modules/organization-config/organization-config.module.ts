import { Module } from '@nestjs/common';
import { OrganizationConfigController } from './organization-config.controller';
import { CreateConfig } from './usecases/create-config/create-config.usecase';

const USE_CASES = [CreateConfig];

@Module({
  controllers: [OrganizationConfigController],
  providers: [...USE_CASES],
})
export class OrganizationConfigModule {}
