import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { BaseCommand } from '@boilerplate/core';
import { ApplyToJobDto } from '../../dtos/careers.dto';

export class ApplyToJobCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orgSlug: string;

  @IsUUID()
  readonly jobId: string;

  @ValidateNested()
  @Type(() => ApplyToJobDto)
  readonly payload: ApplyToJobDto;
}
