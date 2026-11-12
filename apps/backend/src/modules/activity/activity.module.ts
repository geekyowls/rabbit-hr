import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { ListActivities } from './usecases/list-activities/list-activities.usecase';
import { CreateActivity } from './usecases/create-activity/create-activity.usecase';

const USE_CASES = [ListActivities, CreateActivity];

@Module({
  controllers: [ActivityController],
  providers: [...USE_CASES],
})
export class ActivityModule {}
