import { Module } from '@nestjs/common';
import { AtsDashboardController } from './ats-dashboard.controller';
import { GetAtsDashboard } from './usecases/get-ats-dashboard/get-ats-dashboard.usecase';

@Module({
  controllers: [AtsDashboardController],
  providers: [GetAtsDashboard],
})
export class AtsDashboardModule {}
