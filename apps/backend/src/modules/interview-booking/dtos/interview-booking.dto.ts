import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UserSummaryDto } from '@shared/dtos/user-summary.dto';
import { Trim } from '@shared/transformers/trim';
import {
  InterviewBookingLinkStatus,
  InterviewBookingMode,
  InterviewMeetingProvider,
  InterviewStatus,
  InterviewType,
} from '@db/enums';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_BOOKING_INTERVIEWERS = 10;

export class WeeklyHoursIntervalDto {
  @ApiProperty({ minimum: 0, maximum: 6, description: '0 is Sunday' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day!: number;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_PATTERN, { message: 'start must be HH:mm' })
  start!: string;

  @ApiProperty({ example: '17:00' })
  @Matches(TIME_PATTERN, { message: 'end must be HH:mm' })
  end!: string;
}

export class UpdateAvailabilityDto {
  @ApiProperty({ example: 'Europe/London' })
  @IsTimeZone()
  timezone!: string;

  @ApiProperty({ type: [WeeklyHoursIntervalDto] })
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => WeeklyHoursIntervalDto)
  weeklyHours!: WeeklyHoursIntervalDto[];

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  @IsOptional()
  bufferMinutes?: number;

  @ApiPropertyOptional({ default: 240 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(43200)
  @IsOptional()
  minNoticeMinutes?: number;

  @ApiPropertyOptional({ default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  @IsOptional()
  maxDaysAhead?: number;
}

export class AvailabilityResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  timezone!: string;

  @ApiProperty({ type: [WeeklyHoursIntervalDto] })
  weeklyHours!: WeeklyHoursIntervalDto[];

  @ApiProperty()
  bufferMinutes!: number;

  @ApiProperty()
  minNoticeMinutes!: number;

  @ApiProperty()
  maxDaysAhead!: number;

  @ApiProperty({
    description: 'True when the defaults are shown and nothing is saved yet',
  })
  isDefault!: boolean;
}

export class ListTimeOffQueryDto {
  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsDateString()
  @IsOptional()
  to?: string;
}

export class CreateTimeOffDto {
  @ApiProperty({ example: '2026-11-20T00:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: '2026-11-21T00:00:00.000Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  allDay?: boolean;

  @ApiPropertyOptional({ example: 'Annual leave' })
  @IsString()
  @MaxLength(200)
  @Trim()
  @IsOptional()
  reason?: string | null;
}

export class UpdateTimeOffDto extends CreateTimeOffDto {}

export class TimeOffResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  startsAt!: Date;

  @ApiProperty()
  endsAt!: Date;

  @ApiProperty()
  allDay!: boolean;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class CreateBookingLinkDto {
  @ApiProperty()
  @IsUUID()
  applicationId!: string;

  @ApiPropertyOptional({ example: 'First interview' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Trim()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ enum: InterviewType, default: InterviewType.VIDEO })
  @IsEnum(InterviewType)
  @IsOptional()
  type?: InterviewType;

  @ApiPropertyOptional({ default: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(240)
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BOOKING_INTERVIEWERS)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  interviewerIds!: string[];

  @ApiPropertyOptional({
    enum: InterviewBookingMode,
    default: InterviewBookingMode.ANY_INTERVIEWER,
  })
  @IsEnum(InterviewBookingMode)
  @IsOptional()
  mode?: InterviewBookingMode;

  @ApiPropertyOptional({
    enum: InterviewMeetingProvider,
    description: 'Meeting link to create on booking when connected',
  })
  @IsEnum(InterviewMeetingProvider)
  @IsOptional()
  meetingProvider?: InterviewMeetingProvider;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(300)
  @Trim()
  @IsOptional()
  location?: string | null;

  @ApiPropertyOptional({ default: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  expiresInDays?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiPropertyOptional({ description: 'Optional note added to the email' })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  message?: string;
}

export class ListBookingLinksQueryDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ enum: InterviewBookingLinkStatus })
  @IsEnum(InterviewBookingLinkStatus)
  @IsOptional()
  status?: InterviewBookingLinkStatus;
}

export class BookedInterviewSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  scheduledAt!: Date;

  @ApiProperty({ enum: InterviewStatus })
  status!: InterviewStatus;
}

export class BookingLinkResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  applicationId!: string;

  @ApiProperty()
  candidateId!: string;

  @ApiProperty()
  jobId!: string;

  @ApiProperty()
  token!: string;

  @ApiProperty({ example: 'https://app.rabbithr.co/book?token=abc' })
  url!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: InterviewType })
  type!: InterviewType;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty({ type: [String] })
  interviewerIds!: string[];

  @ApiProperty({ type: [UserSummaryDto] })
  interviewers!: UserSummaryDto[];

  @ApiProperty({ enum: InterviewBookingMode })
  mode!: InterviewBookingMode;

  @ApiProperty({ enum: InterviewMeetingProvider })
  meetingProvider!: InterviewMeetingProvider;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty({ enum: InterviewBookingLinkStatus })
  status!: InterviewBookingLinkStatus;

  @ApiPropertyOptional({ nullable: true })
  bookedInterviewId!: string | null;

  @ApiPropertyOptional({ type: BookedInterviewSummaryDto, nullable: true })
  bookedInterview!: BookedInterviewSummaryDto | null;

  @ApiPropertyOptional({ nullable: true })
  bookedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class CreateBookingLinkResponseDto extends BookingLinkResponseDto {
  @ApiProperty()
  emailSent!: boolean;

  @ApiPropertyOptional({ nullable: true })
  emailError!: string | null;
}

export class PublicSlotsQueryDto {
  @ApiProperty({ example: '2026-11-16' })
  @Matches(DATE_PATTERN, { message: 'from must be YYYY-MM-DD' })
  from!: string;

  @ApiProperty({ example: '2026-11-22' })
  @Matches(DATE_PATTERN, { message: 'to must be YYYY-MM-DD' })
  to!: string;

  @ApiPropertyOptional({
    example: 'Europe/London',
    description:
      'Timezone used to group slots by day, defaults to the organization timezone',
  })
  @IsTimeZone()
  @IsOptional()
  timezone?: string;
}

export class BookSlotDto {
  @ApiProperty({ example: '2026-11-17T10:00:00.000Z' })
  @IsDateString()
  startsAt!: string;

  @ApiPropertyOptional({ example: 'Europe/London' })
  @IsTimeZone()
  @IsOptional()
  timezone?: string;
}

export class CancelPublicBookingDto {
  @ApiPropertyOptional()
  @IsString()
  @MaxLength(500)
  @Trim()
  @IsOptional()
  reason?: string;
}

export class PublicBookedSlotDto {
  @ApiProperty()
  interviewId!: string;

  @ApiProperty()
  scheduledAt!: Date;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty()
  timezone!: string;

  @ApiProperty({ enum: InterviewStatus })
  status!: InterviewStatus;

  @ApiPropertyOptional({ nullable: true })
  meetingUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;
}

export class PublicBookingLinkDto {
  @ApiProperty({ enum: InterviewBookingLinkStatus })
  status!: InterviewBookingLinkStatus;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: InterviewType })
  type!: InterviewType;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty()
  jobTitle!: string;

  @ApiProperty()
  companyName!: string;

  @ApiPropertyOptional({ nullable: true })
  companyLogo!: string | null;

  @ApiProperty()
  candidateFirstName!: string;

  @ApiProperty({ description: 'Organization timezone' })
  timezone!: string;

  @ApiProperty()
  locale!: string;

  @ApiProperty()
  expiresAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  location!: string | null;

  @ApiPropertyOptional({ type: PublicBookedSlotDto, nullable: true })
  booking!: PublicBookedSlotDto | null;
}

export class PublicSlotDto {
  @ApiProperty()
  startsAt!: string;

  @ApiProperty({ example: '09:30' })
  time!: string;
}

export class PublicSlotDayDto {
  @ApiProperty({ example: '2026-11-17' })
  date!: string;

  @ApiProperty({ type: [PublicSlotDto] })
  slots!: PublicSlotDto[];
}

export class PublicSlotsResponseDto {
  @ApiProperty()
  timezone!: string;

  @ApiProperty()
  durationMinutes!: number;

  @ApiProperty({ type: [PublicSlotDayDto] })
  days!: PublicSlotDayDto[];
}
