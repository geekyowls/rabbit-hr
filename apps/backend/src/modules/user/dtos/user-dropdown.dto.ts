import { ApiProperty } from '@nestjs/swagger';

export class UserDropdownDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty()
  email!: string;
}
