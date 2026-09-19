import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogActorDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiProperty()
  email: string;
}

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  organizationId: string | null;

  @ApiPropertyOptional()
  actorId: string | null;

  @ApiPropertyOptional({ type: AuditLogActorDto })
  actor?: AuditLogActorDto | null;

  @ApiProperty()
  method: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  statusCode: number;

  @ApiPropertyOptional()
  metadata: Record<string, unknown> | null;

  @ApiPropertyOptional()
  ipAddress: string | null;

  @ApiPropertyOptional()
  userAgent: string | null;

  @ApiPropertyOptional()
  duration: number | null;

  @ApiProperty()
  createdAt: Date;
}
