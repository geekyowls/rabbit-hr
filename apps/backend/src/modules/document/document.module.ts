import { Module } from '@nestjs/common';
import { StorageModule } from '@modules/storage/storage.module';
import { DocumentController } from './document.controller';
import { ListCandidateDocuments } from './usecases/list-candidate-documents/list-candidate-documents.usecase';
import { CreateCandidateDocument } from './usecases/create-candidate-document/create-candidate-document.usecase';
import { VerifyDocument } from './usecases/verify-document/verify-document.usecase';
import { DeleteDocument } from './usecases/delete-document/delete-document.usecase';
import { GetDocumentDownloadUrl } from './usecases/get-document-download-url/get-document-download-url.usecase';

const USE_CASES = [
  ListCandidateDocuments,
  CreateCandidateDocument,
  VerifyDocument,
  DeleteDocument,
  GetDocumentDownloadUrl,
];

@Module({
  imports: [StorageModule],
  controllers: [DocumentController],
  providers: [...USE_CASES],
})
export class DocumentModule {}
