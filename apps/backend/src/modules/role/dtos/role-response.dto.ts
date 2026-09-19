import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [String] })
  permissions!: string[];

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
