import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CalendarCapabilitiesDto {
  @ApiProperty()
  google!: boolean;

  @ApiProperty()
  microsoft!: boolean;
}

class MeetingCapabilitiesDto {
  @ApiProperty()
  googleMeet!: boolean;

  @ApiProperty()
  zoom!: boolean;

  @ApiProperty()
  teams!: boolean;
}

class MailboxCapabilityDto {
  @ApiProperty()
  connected!: boolean;

  @ApiPropertyOptional({ nullable: true, example: 'gmail' })
  provider!: string | null;
}

export class IntegrationCapabilitiesDto {
  @ApiProperty({ type: CalendarCapabilitiesDto })
  calendar!: CalendarCapabilitiesDto;

  @ApiProperty({ type: MeetingCapabilitiesDto })
  meetings!: MeetingCapabilitiesDto;

  @ApiProperty()
  calls!: boolean;

  @ApiProperty()
  whatsapp!: boolean;

  @ApiProperty()
  jobFeed!: boolean;

  @ApiProperty({ type: MailboxCapabilityDto })
  mailbox!: MailboxCapabilityDto;
}
