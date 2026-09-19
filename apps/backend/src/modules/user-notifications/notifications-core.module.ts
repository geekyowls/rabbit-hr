import { Global, Module } from '@nestjs/common';
import { NotificationDispatcher } from './services/notification-dispatcher.service';
import { WebPushService } from './services/web-push.service';
import { NOTIFICATION_CHANNELS } from './channels/notification-channel.interface';
import { InAppNotificationChannel } from './channels/in-app-notification.channel';
import { WebPushNotificationChannel } from './channels/web-push-notification.channel';

@Global()
@Module({
  providers: [
    NotificationDispatcher,
    WebPushService,
    InAppNotificationChannel,
    WebPushNotificationChannel,
    {
      provide: NOTIFICATION_CHANNELS,
      inject: [InAppNotificationChannel, WebPushNotificationChannel],
      useFactory: (
        inApp: InAppNotificationChannel,
        webPush: WebPushNotificationChannel,
      ) => [inApp, webPush],
    },
  ],
  exports: [NotificationDispatcher, WebPushService, NOTIFICATION_CHANNELS],
})
export class NotificationsCoreModule {}
