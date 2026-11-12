import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { ListCandidates } from './usecases/list-candidates/list-candidates.usecase';
import { CreateCandidate } from './usecases/create-candidate/create-candidate.usecase';
import { GetCandidate } from './usecases/get-candidate/get-candidate.usecase';
import { UpdateCandidate } from './usecases/update-candidate/update-candidate.usecase';
import { DeleteCandidate } from './usecases/delete-candidate/delete-candidate.usecase';

const USE_CASES = [
  ListCandidates,
  CreateCandidate,
  GetCandidate,
  UpdateCandidate,
  DeleteCandidate,
];

@Module({
  controllers: [CandidateController],
  providers: [...USE_CASES],
})
export class CandidateModule {}
