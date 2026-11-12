import { IsIn, IsInt, Max, Min } from 'class-validator';
import { PortalCandidateCommand } from '../portal-candidate.command';
import {
  PORTAL_UPLOAD_EXTENSIONS,
  PORTAL_UPLOAD_MAX_BYTES,
  type PortalUploadExtension,
} from '../../dtos/portal.dto';

export class GetPortalUploadUrlCommand extends PortalCandidateCommand {
  @IsIn(PORTAL_UPLOAD_EXTENSIONS)
  readonly extension: PortalUploadExtension;

  @IsInt()
  @Min(1)
  @Max(PORTAL_UPLOAD_MAX_BYTES)
  readonly sizeBytes: number;
}
