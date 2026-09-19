import { ApiProperty } from '@nestjs/swagger';

export class RoleDropdownDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}
