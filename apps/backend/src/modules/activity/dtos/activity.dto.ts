import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { ActivityType } from '@db/enums';

export const MANUAL_ACTIVITY_TYPES = [
  ActivityType.NOTE,
  ActivityType.CALL,
  ActivityType.EMAIL,
] as const;

export type ManualActivityType = (typeof MANUAL_ACTIVITY_TYPES)[number];

export class ListActivitiesDto extends ListPaginationDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;
}

export class CreateActivityDto {
  @ApiPropertyOptional({
    enum: MANUAL_ACTIVITY_TYPES,
    default: ActivityType.NOTE,
  })
  @IsIn(MANUAL_ACTIVITY_TYPES)
  @IsOptional()
  type?: ManualActivityType;

  @ApiPropertyOptional({ example: 'Phone screen' })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  title?: string;

  @ApiProperty({ example: 'Strong communicator, available from next month' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string;
}

export class ActivityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  candidateId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  applicationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  jobId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;

  @ApiProperty({ enum: ActivityType })
  type!: ActivityType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  body!: string | null;

  @ApiPropertyOptional({ nullable: true })
  metadata!: Record<string, unknown> | null;

  @ApiPropertyOptional({ nullable: true })
  actorId!: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  actor!: UserSummaryDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
