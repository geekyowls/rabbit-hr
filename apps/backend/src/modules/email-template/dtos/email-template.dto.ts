import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from '@shared/transformers/trim';
import { EmailTemplateCategory } from '@db/enums';

export class ListEmailTemplatesQueryDto {
  @ApiPropertyOptional({ enum: EmailTemplateCategory })
  @IsEnum(EmailTemplateCategory)
  @IsOptional()
  category?: EmailTemplateCategory;
}

export class CreateEmailTemplateDto {
  @ApiProperty({ example: 'Interview invitation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Trim()
  name!: string;

  @ApiPropertyOptional({
    enum: EmailTemplateCategory,
    default: EmailTemplateCategory.GENERAL,
  })
  @IsEnum(EmailTemplateCategory)
  @IsOptional()
  category?: EmailTemplateCategory;

  @ApiProperty({ example: 'Interview for {{job.title}}' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  subject!: string;

  @ApiProperty({
    example:
      'Hi {{candidate.firstName}}, we would like to invite you to interview.',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateEmailTemplateDto extends PartialType(
  CreateEmailTemplateDto,
) {}

export class SendApplicationEmailDto {
  @ApiPropertyOptional({
    description: 'Template to render; subject and body override it',
  })
  @IsUUID()
  @IsOptional()
  templateId?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: SendApplicationEmailDto) => !o.templateId)
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  subject?: string;

  @ApiPropertyOptional()
  @ValidateIf((o: SendApplicationEmailDto) => !o.templateId)
  @IsString()
  @IsNotEmpty()
  body?: string;
}

export class EmailTemplateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: EmailTemplateCategory })
  category!: EmailTemplateCategory;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class SendApplicationEmailResponseDto {
  @ApiProperty()
  sent!: boolean;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  to!: string;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  activityId!: string;
}
