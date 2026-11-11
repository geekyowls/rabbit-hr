import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { TransformToBoolean } from '@shared/transformers/to-boolean';
import { Trim } from '@shared/transformers/trim';
import { TaskDueFilter, TaskStatus } from '@db/enums';

export class ListTasksDto extends ListPaginationDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    description: 'Only tasks assigned to the current user',
  })
  @IsBoolean()
  @TransformToBoolean()
  @IsOptional()
  mine?: boolean;

  @ApiPropertyOptional({ enum: TaskDueFilter })
  @IsEnum(TaskDueFilter)
  @IsOptional()
  due?: TaskDueFilter;

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

export class CreateTaskDto {
  @ApiProperty({ example: 'Chase references for Amelia' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  @Trim()
  title!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ example: '2026-11-12T09:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  dueAt?: string | null;

  @ApiPropertyOptional({ description: 'Defaults to the current user' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  candidateId?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  jobId?: string | null;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  clientId?: string | null;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}

export class TaskCandidateSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;
}

export class TaskJobSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  reference!: string;
}

export class TaskClientSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class TaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dueAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  assigneeId!: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  assignee!: UserSummaryDto | null;

  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  candidateId!: string | null;

  @ApiPropertyOptional({ type: TaskCandidateSummaryDto, nullable: true })
  candidate!: TaskCandidateSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  applicationId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  jobId!: string | null;

  @ApiPropertyOptional({ type: TaskJobSummaryDto, nullable: true })
  job!: TaskJobSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  clientId!: string | null;

  @ApiPropertyOptional({ type: TaskClientSummaryDto, nullable: true })
  client!: TaskClientSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
