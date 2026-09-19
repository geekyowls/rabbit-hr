import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlResponse {
  @ApiProperty()
  signedUrl!: string;

  @ApiProperty({ description: 'Full public URL for the file' })
  path!: string;

  @ApiProperty({ description: 'Storage key to save in database' })
  key!: string;
}
