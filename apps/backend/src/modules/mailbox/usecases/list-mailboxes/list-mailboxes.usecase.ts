import { Injectable } from '@nestjs/common';
import { MailboxResponseDto, toMailboxResponse } from '../../dtos/mailbox.dto';
import { MailboxAccessService } from '../../services/mailbox-access.service';
import { ListMailboxesCommand } from './list-mailboxes.command';

@Injectable()
export class ListMailboxes {
  constructor(private readonly accessService: MailboxAccessService) {}

  async execute(command: ListMailboxesCommand): Promise<MailboxResponseDto[]> {
    const mailboxes = await this.accessService.listAccessible(
      command.organizationId,
      command.userId,
    );
    return mailboxes.map((mailbox) =>
      toMailboxResponse(
        mailbox,
        command.userId,
        this.accessService.canManage(
          mailbox,
          command.userId,
          command.permissions,
        ),
      ),
    );
  }
}
