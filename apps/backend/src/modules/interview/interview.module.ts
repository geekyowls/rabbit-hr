import { Module } from '@nestjs/common';
import { EmailTemplateModule } from '@modules/email-template/email-template.module';
import { InterviewController } from './interview.controller';
import { ApplicationInterviewsController } from './application-interviews.controller';
import { InterviewInviteService } from './usecases/interview-invite.service';
import { ListInterviews } from './usecases/list-interviews/list-interviews.usecase';
import { CreateInterview } from './usecases/create-interview/create-interview.usecase';
import { GetInterview } from './usecases/get-interview/get-interview.usecase';
import { UpdateInterview } from './usecases/update-interview/update-interview.usecase';
import { UpdateInterviewStatus } from './usecases/update-interview-status/update-interview-status.usecase';
import { DeleteInterview } from './usecases/delete-interview/delete-interview.usecase';
import { SubmitScorecard } from './usecases/submit-scorecard/submit-scorecard.usecase';
import { ListApplicationInterviews } from './usecases/list-application-interviews/list-application-interviews.usecase';

const USE_CASES = [
  ListInterviews,
  CreateInterview,
  GetInterview,
  UpdateInterview,
  UpdateInterviewStatus,
  DeleteInterview,
  SubmitScorecard,
  ListApplicationInterviews,
];

@Module({
  imports: [EmailTemplateModule],
  controllers: [InterviewController, ApplicationInterviewsController],
  providers: [...USE_CASES, InterviewInviteService],
})
export class InterviewModule {}
