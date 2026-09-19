import { ApiProperty } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Bad Request' })
  message!: string;

  @ApiProperty({ example: '2025-01-05T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path!: string;
}

export class ValidationErrorDto extends ErrorDto {
  @ApiProperty({
    example: {
      email: {
        messages: ['email must be an email'],
        value: 'invalid-email',
      },
    },
  })
  errors!: Record<string, { messages: string[]; value?: any }>;
}
