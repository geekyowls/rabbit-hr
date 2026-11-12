import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  PortalCandidate,
  RequireCandidatePortal,
  type PortalCandidateSession,
} from './decorators/portal-candidate.decorator';
import {
  CreatePortalDocumentDto,
  PortalApplicationDetailDto,
  PortalApplicationDto,
  PortalDocumentDto,
  PortalDocumentsDto,
  PortalDownloadUrlDto,
  PortalInterviewsDto,
  PortalMeDto,
  PortalOfferDto,
  PortalOverviewDto,
  PortalProfileDto,
  PortalUploadUrlDto,
  PortalUploadUrlResponseDto,
  UpdatePortalProfileDto,
  WithdrawPortalApplicationDto,
} from './dtos/portal.dto';
import { PortalCandidateCommand } from './usecases/portal-candidate.command';
import { GetPortalMe } from './usecases/get-portal-me/get-portal-me.usecase';
import { GetPortalOverview } from './usecases/get-portal-overview/get-portal-overview.usecase';
import { ListPortalApplications } from './usecases/list-portal-applications/list-portal-applications.usecase';
import { GetPortalApplication } from './usecases/get-portal-application/get-portal-application.usecase';
import { PortalApplicationCommand } from './usecases/get-portal-application/portal-application.command';
import { WithdrawPortalApplication } from './usecases/withdraw-portal-application/withdraw-portal-application.usecase';
import { WithdrawPortalApplicationCommand } from './usecases/withdraw-portal-application/withdraw-portal-application.command';
import { ListPortalInterviews } from './usecases/list-portal-interviews/list-portal-interviews.usecase';
import { ListPortalOffers } from './usecases/list-portal-offers/list-portal-offers.usecase';
import { ListPortalDocuments } from './usecases/list-portal-documents/list-portal-documents.usecase';
import { GetPortalUploadUrl } from './usecases/get-portal-upload-url/get-portal-upload-url.usecase';
import { GetPortalUploadUrlCommand } from './usecases/get-portal-upload-url/get-portal-upload-url.command';
import { CreatePortalDocument } from './usecases/create-portal-document/create-portal-document.usecase';
import { CreatePortalDocumentCommand } from './usecases/create-portal-document/create-portal-document.command';
import { GetPortalDocumentDownloadUrl } from './usecases/get-portal-document-download-url/get-portal-document-download-url.usecase';
import { GetPortalDocumentDownloadUrlCommand } from './usecases/get-portal-document-download-url/get-portal-document-download-url.command';
import { UpdatePortalProfile } from './usecases/update-portal-profile/update-portal-profile.usecase';
import { UpdatePortalProfileCommand } from './usecases/update-portal-profile/update-portal-profile.command';

function scope(session: PortalCandidateSession) {
  return {
    candidateId: session.candidateId,
    organizationId: session.organizationId,
  };
}

@ApiTags('Candidate Portal')
@ApiCommonResponses()
@RequireCandidatePortal()
@Controller('portal')
export class PortalController {
  constructor(
    private readonly getPortalMe: GetPortalMe,
    private readonly getPortalOverview: GetPortalOverview,
    private readonly listPortalApplications: ListPortalApplications,
    private readonly getPortalApplication: GetPortalApplication,
    private readonly withdrawPortalApplication: WithdrawPortalApplication,
    private readonly listPortalInterviews: ListPortalInterviews,
    private readonly listPortalOffers: ListPortalOffers,
    private readonly listPortalDocuments: ListPortalDocuments,
    private readonly getPortalUploadUrl: GetPortalUploadUrl,
    private readonly createPortalDocument: CreatePortalDocument,
    private readonly getPortalDocumentDownloadUrl: GetPortalDocumentDownloadUrl,
    private readonly updatePortalProfile: UpdatePortalProfile,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Signed in candidate profile and branding' })
  @ApiResponse(PortalMeDto)
  async me(@PortalCandidate() session: PortalCandidateSession) {
    return this.getPortalMe.execute(
      PortalCandidateCommand.create(scope(session)),
    );
  }

  @Get('overview')
  @ApiOperation({ summary: 'Portal home summary' })
  @ApiResponse(PortalOverviewDto)
  async overview(@PortalCandidate() session: PortalCandidateSession) {
    return this.getPortalOverview.execute(
      PortalCandidateCommand.create(scope(session)),
    );
  }

  @Get('applications')
  @ApiOperation({ summary: 'List my applications' })
  @ApiResponse(PortalApplicationDto, 200, true)
  async applications(@PortalCandidate() session: PortalCandidateSession) {
    return this.listPortalApplications.execute(
      PortalCandidateCommand.create(scope(session)),
    );
  }

  @Get('applications/:id')
  @ApiOperation({ summary: 'Get one of my applications' })
  @ApiResponse(PortalApplicationDetailDto)
  async application(
    @PortalCandidate() session: PortalCandidateSession,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getPortalApplication.execute(
      PortalApplicationCommand.create({ ...scope(session), applicationId: id }),
    );
  }

  @Post('applications/:id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw one of my applications' })
  @ApiResponse(PortalApplicationDto)
  async withdraw(
    @PortalCandidate() session: PortalCandidateSession,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WithdrawPortalApplicationDto,
  ) {
    return this.withdrawPortalApplication.execute(
      WithdrawPortalApplicationCommand.create({
        ...scope(session),
        applicationId: id,
        reason: dto.reason,
      }),
    );
  }

  @Get('interviews')
  @ApiOperation({ summary: 'My upcoming and past interviews' })
  @ApiResponse(PortalInterviewsDto)
  async interviews(@PortalCandidate() session: PortalCandidateSession) {
    return this.listPortalInterviews.execute(
      PortalCandidateCommand.create(scope(session)),
    );
  }

  @Get('offers')
  @ApiOperation({ summary: 'Offers sent to me' })
  @ApiResponse(PortalOfferDto, 200, true)
  async offers(@PortalCandidate() session: PortalCandidateSession) {
    return this.listPortalOffers.execute(
      PortalCandidateCommand.create(scope(session)),
    );
  }

  @Get('documents')
  @ApiOperation({ summary: 'My documents and outstanding requests' })
  @ApiResponse(PortalDocumentsDto)
  async documents(@PortalCandidate() session: PortalCandidateSession) {
    return this.listPortalDocuments.execute(
      PortalCandidateCommand.create(scope(session)),
    );
  }

  @Post('documents/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a presigned URL to upload a document' })
  @ApiResponse(PortalUploadUrlResponseDto)
  async uploadUrl(
    @PortalCandidate() session: PortalCandidateSession,
    @Body() dto: PortalUploadUrlDto,
  ) {
    return this.getPortalUploadUrl.execute(
      GetPortalUploadUrlCommand.create({
        ...scope(session),
        extension: dto.extension,
        sizeBytes: dto.sizeBytes,
      }),
    );
  }

  @Post('documents')
  @ApiOperation({ summary: 'Save an uploaded document' })
  @ApiResponse(PortalDocumentDto, 201)
  async createDocument(
    @PortalCandidate() session: PortalCandidateSession,
    @Body() dto: CreatePortalDocumentDto,
  ) {
    return this.createPortalDocument.execute(
      CreatePortalDocumentCommand.create({ ...scope(session), payload: dto }),
    );
  }

  @Get('documents/:id/download-url')
  @ApiOperation({ summary: 'Get a short lived download URL for my document' })
  @ApiResponse(PortalDownloadUrlDto)
  async downloadUrl(
    @PortalCandidate() session: PortalCandidateSession,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getPortalDocumentDownloadUrl.execute(
      GetPortalDocumentDownloadUrlCommand.create({
        ...scope(session),
        documentId: id,
      }),
    );
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse(PortalProfileDto)
  async updateProfile(
    @PortalCandidate() session: PortalCandidateSession,
    @Body() dto: UpdatePortalProfileDto,
  ) {
    return this.updatePortalProfile.execute(
      UpdatePortalProfileCommand.create({ ...scope(session), payload: dto }),
    );
  }
}
