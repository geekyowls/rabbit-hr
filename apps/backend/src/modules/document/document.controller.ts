import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS_ENUM } from '@boilerplate/core';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import { RequirePermissions } from '@shared/decorators/require-permissions.decorator';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import {
  CandidateDocumentResponseDto,
  CreateCandidateDocumentDto,
  DocumentDownloadUrlDto,
  VerifyDocumentDto,
} from './dtos/document.dto';
import { ListCandidateDocuments } from './usecases/list-candidate-documents/list-candidate-documents.usecase';
import { ListCandidateDocumentsCommand } from './usecases/list-candidate-documents/list-candidate-documents.command';
import { CreateCandidateDocument } from './usecases/create-candidate-document/create-candidate-document.usecase';
import { CreateCandidateDocumentCommand } from './usecases/create-candidate-document/create-candidate-document.command';
import { VerifyDocument } from './usecases/verify-document/verify-document.usecase';
import { VerifyDocumentCommand } from './usecases/verify-document/verify-document.command';
import { DeleteDocument } from './usecases/delete-document/delete-document.usecase';
import { DeleteDocumentCommand } from './usecases/delete-document/delete-document.command';
import { GetDocumentDownloadUrl } from './usecases/get-document-download-url/get-document-download-url.usecase';
import { GetDocumentDownloadUrlCommand } from './usecases/get-document-download-url/get-document-download-url.command';

@ApiTags('Documents')
@ApiCommonResponses()
@Controller()
export class DocumentController {
  constructor(
    private readonly listCandidateDocuments: ListCandidateDocuments,
    private readonly createCandidateDocument: CreateCandidateDocument,
    private readonly verifyDocument: VerifyDocument,
    private readonly deleteDocument: DeleteDocument,
    private readonly getDocumentDownloadUrl: GetDocumentDownloadUrl,
  ) {}

  @Get('candidates/:id/documents')
  @RequirePermissions(PERMISSIONS_ENUM.DOCUMENT_READ)
  @ApiOperation({ summary: 'List documents for a candidate' })
  @ApiResponse(CandidateDocumentResponseDto, 200, true)
  async list(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.listCandidateDocuments.execute(
      ListCandidateDocumentsCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId: id,
      }),
    );
  }

  @Post('candidates/:id/documents')
  @RequirePermissions(PERMISSIONS_ENUM.DOCUMENT_CREATE)
  @ApiOperation({ summary: 'Save metadata for an uploaded candidate document' })
  @ApiResponse(CandidateDocumentResponseDto, 201)
  async create(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCandidateDocumentDto,
  ) {
    return this.createCandidateDocument.execute(
      CreateCandidateDocumentCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        candidateId: id,
        payload: dto,
      }),
    );
  }

  @Get('documents/:id/download-url')
  @RequirePermissions(PERMISSIONS_ENUM.DOCUMENT_READ)
  @ApiOperation({ summary: 'Get a short-lived download URL for a document' })
  @ApiResponse(DocumentDownloadUrlDto)
  async downloadUrl(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getDocumentDownloadUrl.execute(
      GetDocumentDownloadUrlCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        documentId: id,
      }),
    );
  }

  @Patch('documents/:id/verify')
  @RequirePermissions(PERMISSIONS_ENUM.DOCUMENT_VERIFY)
  @ApiOperation({ summary: 'Verify or reject a document' })
  @ApiResponse(CandidateDocumentResponseDto)
  async verify(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.verifyDocument.execute(
      VerifyDocumentCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        documentId: id,
        status: dto.status,
        notes: dto.notes,
      }),
    );
  }

  @Delete('documents/:id')
  @RequirePermissions(PERMISSIONS_ENUM.DOCUMENT_DELETE)
  @ApiOperation({ summary: 'Delete a document' })
  async delete(
    @UserSession() user: UserSessionData,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteDocument.execute(
      DeleteDocumentCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        documentId: id,
      }),
    );
  }
}
