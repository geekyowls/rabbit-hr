import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty({ nullable: true })
  userAgent: string | null;

  @ApiProperty({ nullable: true })
  ipAddress: string | null;

  @ApiProperty()
  lastUsedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}
