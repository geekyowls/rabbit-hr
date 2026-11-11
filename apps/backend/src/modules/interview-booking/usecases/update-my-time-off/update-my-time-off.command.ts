import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';
import { OrganizationCommand } from '@shared/commands/organization.command';
import { UpdateTimeOffDto } from '../../dtos/interview-booking.dto';

export class UpdateMyTimeOffCommand extends OrganizationCommand {
  @IsUUID()
  readonly timeOffId: string;

  @ValidateNested()
  @Type(() => UpdateTimeOffDto)
  readonly payload: UpdateTimeOffDto;
}
