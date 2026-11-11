import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { GetReportSummary } from './usecases/get-report-summary/get-report-summary.usecase';

@Module({
  controllers: [ReportController],
  providers: [GetReportSummary],
})
export class ReportModule {}
