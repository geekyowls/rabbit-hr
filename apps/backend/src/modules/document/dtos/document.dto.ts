import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { DocumentType, DocumentVerificationStatus } from '@db/enums';

export const DOCUMENT_REVIEW_STATUSES = [
  DocumentVerificationStatus.VERIFIED,
  DocumentVerificationStatus.REJECTED,
] as const;

export type DocumentReviewStatus = (typeof DOCUMENT_REVIEW_STATUSES)[number];

export class CreateCandidateDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  type!: DocumentType;

  @ApiPropertyOptional({ example: 'Passport' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiProperty({
    description: 'Storage key returned by the upload URL endpoint',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  fileKey!: string;

  @ApiProperty({ example: 'passport.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  mimeType?: string;

  @ApiPropertyOptional({ example: 204800 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sizeBytes?: number;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ example: '2027-06-30' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ enum: DOCUMENT_REVIEW_STATUSES })
  @IsIn(DOCUMENT_REVIEW_STATUSES)
  status!: DocumentReviewStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CandidateDocumentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  candidateId!: string;

  @ApiPropertyOptional({ nullable: true })
  applicationId!: string | null;

  @ApiProperty({ enum: DocumentType })
  type!: DocumentType;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  fileKey!: string;

  @ApiProperty()
  fileName!: string;

  @ApiPropertyOptional({ nullable: true })
  mimeType!: string | null;

  @ApiPropertyOptional({ nullable: true })
  sizeBytes!: number | null;

  @ApiProperty({ enum: DocumentVerificationStatus })
  verificationStatus!: DocumentVerificationStatus;

  @ApiPropertyOptional({ nullable: true })
  verifiedBy!: string | null;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true })
  verifier!: UserSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  verifiedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  expiresAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DocumentDownloadUrlDto {
  @ApiProperty()
  url!: string;
}
