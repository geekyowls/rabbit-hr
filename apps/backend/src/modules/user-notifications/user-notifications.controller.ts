import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireAuthentication } from '@shared/decorators/require-authentication.decorator';
import {
  UserSession,
  type UserSessionData,
} from '@shared/decorators/user-session.decorator';
import {
  ListNotificationFeed,
  type NotificationFeedResponse,
} from './usecases/list-notification-feed/list-notification-feed.usecase';
import { ListNotificationFeedCommand } from './usecases/list-notification-feed/list-notification-feed.command';
import { MarkNotificationRead } from './usecases/mark-notification-read/mark-notification-read.usecase';
import { MarkNotificationReadCommand } from './usecases/mark-notification-read/mark-notification-read.command';
import { MarkAllNotificationsRead } from './usecases/mark-all-notifications-read/mark-all-notifications-read.usecase';
import { MarkAllNotificationsReadCommand } from './usecases/mark-all-notifications-read/mark-all-notifications-read.command';
import { SubscribeWebPush } from './usecases/subscribe-web-push/subscribe-web-push.usecase';
import { SubscribeWebPushCommand } from './usecases/subscribe-web-push/subscribe-web-push.command';
import { UnsubscribeWebPush } from './usecases/unsubscribe-web-push/unsubscribe-web-push.usecase';
import { UnsubscribeWebPushCommand } from './usecases/unsubscribe-web-push/unsubscribe-web-push.command';
import { SendTestNotification } from './usecases/send-test-notification/send-test-notification.usecase';
import { SendTestNotificationCommand } from './usecases/send-test-notification/send-test-notification.command';
import {
  SubscribeWebPushDto,
  UnsubscribeWebPushDto,
} from './dtos/web-push.dto';
import { WebPushService } from './services/web-push.service';

@ApiTags('Notification Feed')
@Controller('me/notifications')
export class UserNotificationsController {
  constructor(
    private readonly listNotificationFeed: ListNotificationFeed,
    private readonly markNotificationRead: MarkNotificationRead,
    private readonly markAllNotificationsRead: MarkAllNotificationsRead,
    private readonly subscribeWebPush: SubscribeWebPush,
    private readonly unsubscribeWebPush: UnsubscribeWebPush,
    private readonly sendTestNotification: SendTestNotification,
    private readonly webPushService: WebPushService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @RequireAuthentication()
  @ApiOperation({ summary: 'List the current user notification feed' })
  async feed(
    @UserSession() user: UserSessionData,
  ): Promise<NotificationFeedResponse> {
    return this.listNotificationFeed.execute(
      ListNotificationFeedCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async readAll(
    @UserSession() user: UserSessionData,
  ): Promise<{ success: true }> {
    return this.markAllNotificationsRead.execute(
      MarkAllNotificationsReadCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Get('web-push/public-key')
  @RequireAuthentication()
  @ApiOperation({ summary: 'Get the VAPID public key for web push' })
  publicKey(): { publicKey: string; enabled: boolean } {
    return {
      publicKey: this.webPushService.getPublicKey(),
      enabled: this.webPushService.isEnabled(),
    };
  }

  @Post('web-push/subscribe')
  @HttpCode(HttpStatus.OK)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Register a browser web push subscription' })
  async subscribe(
    @UserSession() user: UserSessionData,
    @Body() dto: SubscribeWebPushDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<{ success: true }> {
    return this.subscribeWebPush.execute(
      SubscribeWebPushCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: userAgent?.slice(0, 255),
      }),
    );
  }

  @Post('web-push/unsubscribe')
  @HttpCode(HttpStatus.OK)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Remove a browser web push subscription' })
  async unsubscribe(
    @UserSession() user: UserSessionData,
    @Body() dto: UnsubscribeWebPushDto,
  ): Promise<{ success: true }> {
    return this.unsubscribeWebPush.execute(
      UnsubscribeWebPushCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        endpoint: dto.endpoint,
      }),
    );
  }

  @Post('dev/test')
  @HttpCode(HttpStatus.OK)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Dev only: send a test notification to yourself' })
  async devTest(
    @UserSession() user: UserSessionData,
  ): Promise<{ success: true }> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new NotFoundException();
    }
    return this.sendTestNotification.execute(
      SendTestNotificationCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
      }),
    );
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @RequireAuthentication()
  @ApiOperation({ summary: 'Mark a notification as read' })
  async read(
    @UserSession() user: UserSessionData,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.markNotificationRead.execute(
      MarkNotificationReadCommand.create({
        userId: user.userId,
        organizationId: user.organizationId,
        notificationId: id,
      }),
    );
  }
}
