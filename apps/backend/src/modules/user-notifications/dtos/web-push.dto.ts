import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class WebPushKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class SubscribeWebPushDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ValidateNested()
  @Type(() => WebPushKeysDto)
  keys: WebPushKeysDto;
}

export class UnsubscribeWebPushDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;
}
