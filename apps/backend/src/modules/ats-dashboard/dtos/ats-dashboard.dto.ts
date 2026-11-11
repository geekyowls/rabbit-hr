import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStage } from '@db/enums';
import { ActivityResponseDto } from '@modules/activity/dtos/activity.dto';
import { TaskResponseDto } from '@modules/task/dtos/task.dto';

export class AtsDashboardTotalsDto {
  @ApiProperty()
  openJobs!: number;

  @ApiProperty()
  candidates!: number;

  @ApiProperty()
  activeApplications!: number;

  @ApiProperty()
  placementsThisMonth!: number;

  @ApiProperty()
  interviews!: number;
}

export class StageCountDto {
  @ApiProperty({ enum: ApplicationStage })
  stage!: ApplicationStage;

  @ApiProperty()
  count!: number;
}

export class ClientApplicationCountDto {
  @ApiProperty()
  clientId!: string;

  @ApiProperty()
  clientName!: string;

  @ApiProperty()
  count!: number;
}

export class DailyApplicationCountDto {
  @ApiProperty({ example: '2026-11-11' })
  date!: string;

  @ApiProperty()
  count!: number;
}

export class AtsDashboardResponseDto {
  @ApiProperty({ type: AtsDashboardTotalsDto })
  totals!: AtsDashboardTotalsDto;

  @ApiProperty({ type: [StageCountDto] })
  funnel!: StageCountDto[];

  @ApiProperty({ type: [ClientApplicationCountDto] })
  applicationsByClient!: ClientApplicationCountDto[];

  @ApiProperty({ type: [DailyApplicationCountDto] })
  applicationsPerDay!: DailyApplicationCountDto[];

  @ApiProperty({ type: [ActivityResponseDto] })
  recentActivities!: ActivityResponseDto[];

  @ApiProperty({ type: [TaskResponseDto] })
  myOpenTasks!: TaskResponseDto[];
}
