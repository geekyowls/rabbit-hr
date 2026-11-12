import { IsOptional, IsTimeZone, Matches } from 'class-validator';
import { PublicBookingTokenCommand } from '../public-booking-token.command';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class ListPublicBookingSlotsCommand extends PublicBookingTokenCommand {
  @Matches(DATE_PATTERN)
  readonly from: string;

  @Matches(DATE_PATTERN)
  readonly to: string;

  @IsTimeZone()
  @IsOptional()
  readonly timezone?: string;
}
