import { Module } from '@nestjs/common';
import { UserNotificationsController } from './user-notifications.controller';
import { NotificationsCoreModule } from './notifications-core.module';
import { ListNotificationFeed } from './usecases/list-notification-feed/list-notification-feed.usecase';
import { MarkNotificationRead } from './usecases/mark-notification-read/mark-notification-read.usecase';
import { MarkAllNotificationsRead } from './usecases/mark-all-notifications-read/mark-all-notifications-read.usecase';
import { SubscribeWebPush } from './usecases/subscribe-web-push/subscribe-web-push.usecase';
import { UnsubscribeWebPush } from './usecases/unsubscribe-web-push/unsubscribe-web-push.usecase';
import { SendTestNotification } from './usecases/send-test-notification/send-test-notification.usecase';

@Module({
  imports: [NotificationsCoreModule],
  controllers: [UserNotificationsController],
  providers: [
    ListNotificationFeed,
    MarkNotificationRead,
    MarkAllNotificationsRead,
    SubscribeWebPush,
    UnsubscribeWebPush,
    SendTestNotification,
  ],
})
export class UserNotificationsModule {}
