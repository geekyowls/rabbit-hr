import { Module } from '@nestjs/common';
import { USE_CASES } from './usecases';

@Module({
  imports: [],
  providers: [...USE_CASES],
  exports: [...USE_CASES],
})
export class MailModule {}
