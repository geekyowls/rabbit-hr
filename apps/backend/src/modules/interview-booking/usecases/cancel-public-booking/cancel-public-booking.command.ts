import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PublicBookingTokenCommand } from '../public-booking-token.command';

export class CancelPublicBookingCommand extends PublicBookingTokenCommand {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  readonly reason?: string;
}
