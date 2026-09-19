import { ApiProperty } from '@nestjs/swagger';

export class InviteResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  inviteLink!: string;

  @ApiProperty()
  emailSent!: boolean;
}
