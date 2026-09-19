import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@shared/decorators/api-response.decorator';
import { ApiCommonResponses } from '@shared/decorators/api-common-responses.decorator';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import { UserSession } from '@shared/decorators/user-session.decorator';
import type { UserSessionData } from '@shared/decorators/user-session.decorator';
import { GetUploadUrlQueryDto } from './dtos/get-upload-url.dto';
import { UploadUrlResponse } from './dtos/upload-url-response.dto';
import { GetSignedUrlCommand } from './usecases/get-signed-url/get-signed-url.command';
import { GetSignedUrl } from './usecases/get-signed-url/get-signed-url.usecase';

@Controller('storage')
@ApiTags('Storage')
@ApiCommonResponses()
@RequireAuthentication()
export class StorageController {
  constructor(private readonly getSignedUrlUsecase: GetSignedUrl) {}

  @Get('/upload-url')
  @ApiOperation({ summary: 'Get signed URL for file upload' })
  @ApiResponse(UploadUrlResponse)
  async getUploadUrl(
    @UserSession() user: UserSessionData,
    @Query() query: GetUploadUrlQueryDto,
  ): Promise<UploadUrlResponse> {
    return await this.getSignedUrlUsecase.execute(
      GetSignedUrlCommand.create({
        organizationId: user.organizationId,
        userId: user.userId,
        extension: query.extension,
        type: query.type,
      }),
    );
  }
}
