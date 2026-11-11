import { IsDateString, IsOptional, IsTimeZone } from 'class-validator';
import { PublicBookingTokenCommand } from '../public-booking-token.command';

export class BookPublicSlotCommand extends PublicBookingTokenCommand {
  @IsDateString()
  readonly startsAt: string;

  @IsTimeZone()
  @IsOptional()
  readonly timezone?: string;
}
