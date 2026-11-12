import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BaseCommand } from '@boilerplate/core';
import {
  CAREERS_CV_EXTENSIONS,
  CAREERS_CV_MAX_BYTES,
} from '../../dtos/careers.dto';

export class GetCareersUploadUrlCommand extends BaseCommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  readonly orgSlug: string;

  @IsIn(CAREERS_CV_EXTENSIONS)
  readonly extension: (typeof CAREERS_CV_EXTENSIONS)[number];

  @IsInt()
  @Min(1)
  @Max(CAREERS_CV_MAX_BYTES)
  readonly sizeBytes: number;
}
