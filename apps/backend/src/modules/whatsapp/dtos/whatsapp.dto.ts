import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ListPaginationDto } from '@shared/dtos/list-pagination.dto';

export const TEMPLATE_NAME_PATTERN = /^[a-z0-9_]+$/;

export class WhatsappMessageDto {
  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty()
  @IsUUID()
  candidateId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  applicationId?: string;
}

export class UpdateTemplateMappingDto {
  @ApiProperty({
    description:
      "Variable key ('body.1', 'header.1') to { type: 'placeholder', key } or { type: 'text', value }",
  })
  @IsObject()
  mapping: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}

export class AddTemplateDto {
  @ApiProperty({ description: 'Template name exactly as approved' })
  @IsString()
  @Matches(TEMPLATE_NAME_PATTERN, {
    message: 'Use the exact template name: lowercase letters, numbers and _',
  })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Template language code, e.g. en' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @ApiProperty({
    description: 'Approved body text with {{1}}, {{2}} variables',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  body: string;

  @ApiPropertyOptional({ description: 'Text header, if the template has one' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  headerText?: string;
}

export class ListCandidateWhatsappMessagesDto extends ListPaginationDto {}
