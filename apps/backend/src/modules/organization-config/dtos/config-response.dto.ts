import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationConfigType } from '@db/enums';

export class ConfigResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({
    enum: OrganizationConfigType,
    example: OrganizationConfigType.CLIENT_TAG,
  })
  type!: OrganizationConfigType;

  @ApiProperty({ example: 'VIP' })
  name!: string;

  @ApiPropertyOptional({ type: Object, example: { color: '#ff0000' } })
  value?: Record<string, unknown> | null;

  @ApiProperty({ example: false })
  isDefault!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;
}
