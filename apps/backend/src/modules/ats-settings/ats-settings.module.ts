import { Module } from '@nestjs/common';
import { AtsSettingsController } from './ats-settings.controller';
import { GetAtsSettings } from './usecases/get-ats-settings/get-ats-settings.usecase';
import { UpdateAtsSettings } from './usecases/update-ats-settings/update-ats-settings.usecase';

@Module({
  controllers: [AtsSettingsController],
  providers: [GetAtsSettings, UpdateAtsSettings],
})
export class AtsSettingsModule {}
