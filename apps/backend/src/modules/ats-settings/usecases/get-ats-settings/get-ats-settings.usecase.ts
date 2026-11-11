import { Injectable } from '@nestjs/common';
import { OrganizationAtsSettings } from '@db/entities';
import { AtsSettingsService } from '@shared/services/ats-settings.service';
import { GetAtsSettingsCommand } from './get-ats-settings.command';

@Injectable()
export class GetAtsSettings {
  constructor(private readonly atsSettingsService: AtsSettingsService) {}

  async execute(
    command: GetAtsSettingsCommand,
  ): Promise<OrganizationAtsSettings> {
    return this.atsSettingsService.get(command.organizationId);
  }
}
