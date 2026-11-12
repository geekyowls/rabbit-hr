import { Injectable } from '@nestjs/common';
import { EmailFolder, MailboxConnectionStatus } from '@db/enums';
import {
  EmailMessageRepository,
  EmailThreadRepository,
} from '@db/repositories';
import { MailboxAccessService } from '@modules/mailbox/services/mailbox-access.service';
import { InboxStatsDto } from '../../dtos/inbox.dto';
import { GetInboxStatsCommand } from './get-inbox-stats.command';

const REPLY_WINDOW_DAYS = 7;
const FIRST_REPLY_WINDOW_DAYS = 30;

@Injectable()
export class GetInboxStats {
  constructor(
    private readonly threadRepository: EmailThreadRepository,
    private readonly messageRepository: EmailMessageRepository,
    private readonly accessService: MailboxAccessService,
  ) {}

  async execute(command: GetInboxStatsCommand): Promise<InboxStatsDto> {
    const { organizationId } = command;
    const mailboxes = await this.accessService.listAccessible(
      organizationId,
      command.userId,
    );
    const connected = mailboxes.some(
      (mailbox) => mailbox.status === MailboxConnectionStatus.CONNECTED,
    );
    const mailboxIds = await this.accessService.resolveIds(
      organizationId,
      command.userId,
      command.mailboxId,
    );
    if (mailboxIds.length === 0) {
      return {
        connected,
        unread: 0,
        inboxCount: 0,
        repliesLast7Days: 0,
        medianFirstReplyHours: null,
        firstReplySampleSize: 0,
      };
    }

    const [counts, replies, firstReply] = await Promise.all([
      this.threadRepository
        .createQueryBuilder('thread')
        .select('COUNT(*)', 'inboxCount')
        .addSelect('COUNT(*) FILTER (WHERE thread.unreadCount > 0)', 'unread')
        .where('thread.organizationId = :organizationId', { organizationId })
        .andWhere('thread.mailboxId IN (:...mailboxIds)', { mailboxIds })
        .andWhere('thread.folder = :folder', { folder: EmailFolder.INBOX })
        .getRawOne<{ inboxCount: string; unread: string }>(),
      this.messageRepository
        .createQueryBuilder('message')
        .where('message.organizationId = :organizationId', { organizationId })
        .andWhere('message.mailboxId IN (:...mailboxIds)', { mailboxIds })
        .andWhere('message.isOutbound = true')
        .andWhere('message.sentByUserId IS NOT NULL')
        .andWhere(
          `message.sentAt >= NOW() - INTERVAL '${REPLY_WINDOW_DAYS} days'`,
        )
        .andWhere(
          `EXISTS (SELECT 1 FROM email_messages earlier WHERE earlier."threadId" = message."threadId" AND earlier."isOutbound" = false AND earlier."sentAt" < message."sentAt")`,
        )
        .getCount(),
      this.messageRepository.query(
        `WITH firsts AS (
           SELECT m."threadId", MIN(m."sentAt") AS first_in
           FROM email_messages m
           WHERE m."organizationId" = $1
             AND m."mailboxId" = ANY($2::uuid[])
             AND m."isOutbound" = false
             AND m."sentAt" >= NOW() - INTERVAL '${FIRST_REPLY_WINDOW_DAYS} days'
           GROUP BY m."threadId"
         ),
         replies AS (
           SELECT EXTRACT(EPOCH FROM (MIN(o."sentAt") - f.first_in)) / 3600 AS hours
           FROM firsts f
           JOIN email_messages o
             ON o."threadId" = f."threadId"
            AND o."isOutbound" = true
            AND o."sentAt" > f.first_in
           GROUP BY f."threadId", f.first_in
         )
         SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY hours) AS median,
                COUNT(*)::int AS sample
         FROM replies`,
        [organizationId, mailboxIds],
      ),
    ]);

    const median = firstReply[0]?.median;
    return {
      connected,
      unread: Number(counts?.unread ?? 0),
      inboxCount: Number(counts?.inboxCount ?? 0),
      repliesLast7Days: replies,
      medianFirstReplyHours:
        median === null || median === undefined
          ? null
          : Math.round(Number(median) * 10) / 10,
      firstReplySampleSize: Number(firstReply[0]?.sample ?? 0),
    };
  }
}
