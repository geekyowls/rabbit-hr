import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { CallDisposition } from '@db/enums';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';
import { Trim } from '@shared/transformers/trim';

export const PHONE_PATTERN = /^\+?[0-9\s\-().]{7,25}$/;

export class InitiateCallDto {
  @ApiProperty({ description: 'Phone of the recruiter, dialled first' })
  @Trim()
  @IsString()
  @Matches(PHONE_PATTERN, {
    message: 'staffPhone must be a valid phone number',
  })
  staffPhone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}

export class ListCandidateCallsDto extends ListPaginationDto {}

export class UpdateCallDto {
  @ApiPropertyOptional({ enum: CallDisposition, nullable: true })
  @IsOptional()
  @IsEnum(CallDisposition)
  disposition?: CallDisposition | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  note?: string | null;
}

export interface PlivoHangupBody {
  CallUUID?: string;
  From?: string;
  To?: string;
  CallStatus?: string;
  StartTime?: string;
  EndTime?: string;
  Duration?: string;
  BillDuration?: string;
  HangupCause?: string;
}
