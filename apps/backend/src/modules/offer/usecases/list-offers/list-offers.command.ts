import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { BasePaginatedCommand } from '@boilerplate/core';
import { OfferStatus } from '@db/enums';

export class ListOffersCommand extends BasePaginatedCommand {
  @IsEnum(OfferStatus)
  @IsOptional()
  status?: OfferStatus;

  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  candidateId?: string;

  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  search?: string;
}
