import { Module } from '@nestjs/common';
import { StorageModule } from '@modules/storage/storage.module';
import { PortalAuthController } from './portal-auth.controller';
import { PortalController } from './portal.controller';
import { PortalInviteController } from './portal-invite.controller';
import { CandidatePortalGuard } from './guards/candidate-portal.guard';
import { PortalTokenService } from './services/portal-token.service';
import { PortalOtpStore } from './services/portal-otp.store';
import { PortalMailService } from './services/portal-mail.service';
import { GetPortalBranding } from './usecases/get-portal-branding/get-portal-branding.usecase';
import { RequestPortalOtp } from './usecases/request-portal-otp/request-portal-otp.usecase';
import { VerifyPortalOtp } from './usecases/verify-portal-otp/verify-portal-otp.usecase';
import { RefreshPortalSession } from './usecases/refresh-portal-session/refresh-portal-session.usecase';
import { LogoutPortal } from './usecases/logout-portal/logout-portal.usecase';
import { GetPortalMe } from './usecases/get-portal-me/get-portal-me.usecase';
import { GetPortalOverview } from './usecases/get-portal-overview/get-portal-overview.usecase';
import { ListPortalApplications } from './usecases/list-portal-applications/list-portal-applications.usecase';
import { GetPortalApplication } from './usecases/get-portal-application/get-portal-application.usecase';
import { WithdrawPortalApplication } from './usecases/withdraw-portal-application/withdraw-portal-application.usecase';
import { ListPortalInterviews } from './usecases/list-portal-interviews/list-portal-interviews.usecase';
import { ListPortalOffers } from './usecases/list-portal-offers/list-portal-offers.usecase';
import { ListPortalDocuments } from './usecases/list-portal-documents/list-portal-documents.usecase';
import { GetPortalUploadUrl } from './usecases/get-portal-upload-url/get-portal-upload-url.usecase';
import { CreatePortalDocument } from './usecases/create-portal-document/create-portal-document.usecase';
import { GetPortalDocumentDownloadUrl } from './usecases/get-portal-document-download-url/get-portal-document-download-url.usecase';
import { UpdatePortalProfile } from './usecases/update-portal-profile/update-portal-profile.usecase';
import { InviteCandidateToPortal } from './usecases/invite-candidate-to-portal/invite-candidate-to-portal.usecase';

const USE_CASES = [
  GetPortalBranding,
  RequestPortalOtp,
  VerifyPortalOtp,
  RefreshPortalSession,
  LogoutPortal,
  GetPortalMe,
  GetPortalOverview,
  ListPortalApplications,
  GetPortalApplication,
  WithdrawPortalApplication,
  ListPortalInterviews,
  ListPortalOffers,
  ListPortalDocuments,
  GetPortalUploadUrl,
  CreatePortalDocument,
  GetPortalDocumentDownloadUrl,
  UpdatePortalProfile,
  InviteCandidateToPortal,
];

@Module({
  imports: [StorageModule],
  controllers: [PortalAuthController, PortalController, PortalInviteController],
  providers: [
    ...USE_CASES,
    CandidatePortalGuard,
    PortalTokenService,
    PortalOtpStore,
    PortalMailService,
  ],
})
export class CandidatePortalModule {}
