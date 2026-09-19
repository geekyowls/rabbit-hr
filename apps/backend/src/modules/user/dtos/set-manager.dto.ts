import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class SetManagerDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
    nullable: true,
    description: 'Manager user ID. Set to null to remove manager.',
  })
  @IsUUID()
  @IsOptional()
  managerId?: string | null;
}
