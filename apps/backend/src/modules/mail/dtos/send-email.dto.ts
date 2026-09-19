import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class SendEmailRequestDto {
  @ApiProperty({
    description: 'Recipient email addresses',
    example: ['user@example.com'],
    type: [String],
  })
  @IsEmail({}, { each: true })
  @IsArray()
  to!: string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to our platform',
  })
  @IsString()
  subject!: string;

  @ApiProperty({
    description: 'Email text body',
    example: 'Welcome to our platform!',
  })
  @IsString()
  text!: string;

  @ApiProperty({
    description: 'Email HTML body (optional)',
    example: '<p>Welcome to our platform!</p>',
    required: false,
  })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiProperty({
    description: 'Reply-to email address (optional)',
    example: 'support@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  replyTo?: string;
}

export class SendEmailResponseDto {
  @ApiProperty({
    description: 'Email message ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  messageId!: string;

  @ApiProperty({
    description: 'Indicates if email was sent successfully',
    example: true,
  })
  success!: boolean;
}
