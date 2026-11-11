import { DataSource } from 'typeorm';
import {
  ActivityEntity,
  ApplicationEntity,
  ClientContactEntity,
  EmailAttachmentMeta,
  EmailMessageEntity,
  EmailParticipant,
  EmailThreadEntity,
  MailboxConnectionEntity,
  UserEntity,
} from '../src/database/entities';
import {
  ActivityType,
  EmailDeliveryStatus,
  EmailDirection,
  EmailFolder,
  MailboxConnectionStatus,
  MailboxProvider,
} from '../src/database/enums';
import { mulberry32, SeedAtsContext } from './seed-ats';

const rand = mulberry32(20261113);
const int = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(rand() * items.length)];
const chance = (p: number) => rand() < p;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const NOW = Date.now();
const DEMO_PREFIX = 'demo-';
const DEMO_DOMAIN = 'demo.rabbithr.local';
const CANDIDATE_THREADS = 22;
const CLIENT_THREADS = 12;

interface Party {
  email: string;
  name: string;
  firstName: string;
}

interface Step {
  from: 'me' | 'them';
  body: string;
  attachment?: EmailAttachmentMeta;
}

interface Script {
  subject: string;
  steps: Step[];
}

interface ThreadPlan {
  script: Script;
  counterpart: Party;
  cc: Party[];
  candidateId: string | null;
  clientId: string | null;
  clientContactId: string | null;
  applicationId: string | null;
  folder: EmailFolder;
}

const cv = (name: string): EmailAttachmentMeta => ({
  filename: `${name.replace(/\s+/g, '_')}_CV.pdf`,
  mimeType: 'application/pdf',
  size: int(80_000, 420_000),
  providerAttachmentId: null,
});

function candidateScripts(job: string, client: string, them: Party, me: Party) {
  const scripts: Script[] = [
    {
      subject: `Interview availability for ${job}`,
      steps: [
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nGreat news, ${client} would like to meet you for the ${job} role. Could you send me two or three times that work for you next week?\n\nThanks,\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `Hi ${me.firstName},\n\nThat is brilliant, thank you. I am free Tuesday after 2pm, Wednesday morning or any time Thursday.\n\nBest wishes,\n${them.firstName}`,
        },
        {
          from: 'me',
          body: `Perfect, I have booked Wednesday at 10am. I will send the calendar invite and directions shortly.\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `Received, see you then. Is there anything I should prepare?\n\n${them.firstName}`,
        },
      ],
    },
    {
      subject: `CV for the ${job} role`,
      steps: [
        {
          from: 'them',
          body: `Hello,\n\nPlease find my updated CV attached for the ${job} position. I have just finished a contract so I am available immediately.\n\nKind regards,\n${them.name}`,
          attachment: cv(them.name),
        },
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nThanks for sending this over, CV received. I will review it today and give you a call tomorrow to talk through the role with ${client}.\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `Thank you, speak tomorrow.\n\n${them.firstName}`,
        },
      ],
    },
    {
      subject: `Question about the offer for ${job}`,
      steps: [
        {
          from: 'them',
          body: `Hi ${me.firstName},\n\nThank you for the offer, I am really pleased. Could you confirm whether the salary includes the shift allowance, and when the start date would be?\n\nThanks,\n${them.firstName}`,
        },
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nThe base salary excludes the shift allowance, which is paid on top for nights and weekends. ${client} are flexible on the start date, the first two weeks of next month both work.\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `That is great, thank you. I am happy to accept and would like to start on the 1st.\n\n${them.firstName}`,
        },
      ],
    },
    {
      subject: `${job} opportunity with ${client}`,
      steps: [
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nI came across your profile and think you would be a strong fit for a ${job} role with ${client}. Would you be open to a quick call this week?\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `Hi ${me.firstName},\n\nThanks for reaching out, yes I would be interested. I can talk any evening after 5pm.\n\n${them.firstName}`,
        },
        {
          from: 'me',
          body: `Perfect, I will call you Thursday at 6pm.\n\n${me.firstName}`,
        },
      ],
    },
    {
      subject: 'Eligibility documents',
      steps: [
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nBefore your first shift we need a copy of your ID and eligibility documents. A photo of your passport or work permit is fine.\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `Hi,\n\nMy work permit is attached. Let me know if you need anything else.\n\n${them.firstName}`,
          attachment: {
            filename: 'work_permit.pdf',
            mimeType: 'application/pdf',
            size: int(40_000, 90_000),
            providerAttachmentId: null,
          },
        },
        {
          from: 'me',
          body: 'Thank you, that is all we need for now.',
        },
      ],
    },
    {
      subject: `Weekend shifts available near you`,
      steps: [
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nWe have some ${job} shifts this weekend with ${client}. Let me know if you would like any of them.\n\n${me.firstName}`,
        },
      ],
    },
    {
      subject: `Following up on my ${job} application`,
      steps: [
        {
          from: 'them',
          body: `Hello ${me.firstName},\n\nI interviewed for the ${job} role last week and wondered if there was any feedback yet?\n\nMany thanks,\n${them.firstName}`,
        },
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nThanks for checking in. the client is finishing interviews this week, I expect feedback by Friday.\n\n${me.firstName}`,
        },
      ],
    },
  ];
  return scripts;
}

function clientScripts(job: string, them: Party, me: Party) {
  const scripts: Script[] = [
    {
      subject: `Feedback on shortlist for ${job}`,
      steps: [
        {
          from: 'them',
          body: `Hi ${me.firstName},\n\nThanks for the shortlist. We liked the first two candidates and would like to interview both. The third is a little light on experience for us.\n\nRegards,\n${them.name}`,
        },
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nThanks for the quick feedback. I will line up interviews with both and come back with times by tomorrow.\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: 'Great, Thursday afternoon works best on our side.',
        },
      ],
    },
    {
      subject: `Shortlist: ${job}`,
      steps: [
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nPlease find three shortlisted candidates for the ${job} vacancy below, all available within two weeks. Happy to arrange interviews whenever suits.\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `Thanks ${me.firstName}, I will review with the hiring manager and get back to you by Friday.`,
        },
        {
          from: 'me',
          body: `Thanks, speak Friday.\n\n${me.firstName}`,
        },
      ],
    },
    {
      subject: 'Interview slots next week',
      steps: [
        {
          from: 'them',
          body: `Hi ${me.firstName},\n\nWe have interview slots on Monday at 11am and 2pm. Could you confirm which candidates can make those?\n\n${them.firstName}`,
        },
        {
          from: 'me',
          body: 'Both candidates are confirmed, 11am and 2pm respectively. Invites are on their way.',
        },
        {
          from: 'them',
          body: `Thanks, much appreciated.`,
        },
      ],
    },
    {
      subject: `New vacancy: ${job}`,
      steps: [
        {
          from: 'them',
          body: `Hi ${me.firstName},\n\nWe have another ${job} position opening up next month. Same terms as last time, can you start sourcing?\n\nThanks,\n${them.firstName}`,
        },
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nAbsolutely, I will get the job live today and send the first CVs over this week.\n\n${me.firstName}`,
        },
        {
          from: 'them',
          body: `Brilliant, thank you.`,
        },
      ],
    },
    {
      subject: `Timesheet query for ${job} placement`,
      steps: [
        {
          from: 'them',
          body: `Hello,\n\nThe timesheet for last week shows 42 hours but our rota says 40. Could you check with the worker?\n\n${them.firstName}`,
        },
        {
          from: 'me',
          body: `Hi ${them.firstName},\n\nI have checked with the worker, they stayed two hours late on Thursday at the shift lead's request. I will send the signed sheet over.\n\n${me.firstName}`,
        },
      ],
    },
  ];
  return scripts;
}

const UNLINKED: Array<{ from: Party; subject: string; body: string }> = [
  {
    from: {
      email: 'alerts@jobboard.example.com',
      name: 'Job Board Alerts',
      firstName: 'Job Board',
    },
    subject: 'Your job advert is now live',
    body: 'Your advert has been published and is now visible to candidates. You can view responses from your dashboard.',
  },
  {
    from: {
      email: 'events@recruitmentweek.example.com',
      name: 'Recruitment Week',
      firstName: 'Recruitment Week',
    },
    subject: 'Invitation: staffing leaders breakfast',
    body: 'Join other agency leaders for a breakfast briefing on the latest employment legislation changes.',
  },
  {
    from: {
      email: 'accounts@supplier.example.com',
      name: 'Accounts Team',
      firstName: 'Accounts',
    },
    subject: 'Invoice INV-20431 is ready',
    body: 'Your monthly invoice is ready to view. Payment is due within 30 days.',
  },
  {
    from: {
      email: 'sam.turner@example.com',
      name: 'Sam Turner',
      firstName: 'Sam',
    },
    subject: 'Do you have any warehouse work near Leeds?',
    body: 'Hi, I was given your details by a friend. I am looking for warehouse or driving work around Leeds, do you have anything?',
  },
  {
    from: {
      email: 'newsletter@hrinsights.example.com',
      name: 'HR Insights',
      firstName: 'HR Insights',
    },
    subject: 'This week in recruitment: pay trends',
    body: 'Average advertised pay for care roles rose again this quarter. Read the full report inside.',
  },
  {
    from: {
      email: 'jordan.ellis@example.com',
      name: 'Jordan Ellis',
      firstName: 'Jordan',
    },
    subject: 'Referral for a friend',
    body: 'Hi, my friend is a qualified electrician looking for contract work. Can I pass on your email?',
  },
];

function toHtml(text: string): string {
  return text
    .split(/\n\n/)
    .map(
      (paragraph) =>
        `<p>${paragraph
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br />')}</p>`,
    )
    .join('');
}

function snippet(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 200 ? `${flat.slice(0, 197)}...` : flat;
}

function participant(party: Party): EmailParticipant {
  return { email: party.email.toLowerCase(), name: party.name };
}

export async function seedAtsPhase3c(
  dataSource: DataSource,
  context: SeedAtsContext,
): Promise<void> {
  const { organizationId, adminUserId } = context;
  const mailboxRepo = dataSource.getRepository(MailboxConnectionEntity);
  const threadRepo = dataSource.getRepository(EmailThreadEntity);
  const messageRepo = dataSource.getRepository(EmailMessageEntity);
  const activityRepo = dataSource.getRepository(ActivityEntity);

  const admin = await dataSource.getRepository(UserEntity).findOne({
    where: { id: adminUserId },
    select: ['id', 'email', 'firstName', 'lastName'],
  });
  if (!admin) return;
  const me: Party = {
    email: admin.email.toLowerCase(),
    name: `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim(),
    firstName: admin.firstName ?? 'Admin',
  };

  let mailbox = await mailboxRepo.findOne({
    where: { organizationId, isDemo: true, provider: MailboxProvider.GMAIL },
  });
  if (!mailbox) {
    mailbox = await mailboxRepo.save(
      mailboxRepo.create({
        organizationId,
        userId: admin.id,
        connectedById: admin.id,
        provider: MailboxProvider.GMAIL,
        emailAddress: me.email,
        displayName: me.name,
        isShared: false,
        encryptedTokens: null,
        tokenExpiresAt: null,
        status: MailboxConnectionStatus.CONNECTED,
        syncEnabled: false,
        isDemo: true,
        lastSyncedAt: new Date(NOW),
      }),
    );
    console.log(
      `Created demo mailbox (isDemo=true, never synced): ${me.email}`,
    );
  }

  const existing = await threadRepo.count({ where: { mailboxId: mailbox.id } });
  if (existing > 0) {
    console.log(`Demo inbox already seeded (${existing} threads), skipping`);
    return;
  }

  const applications = await dataSource
    .getRepository(ApplicationEntity)
    .createQueryBuilder('application')
    .innerJoin('application.candidate', 'candidate')
    .addSelect([
      'candidate.id',
      'candidate.firstName',
      'candidate.lastName',
      'candidate.email',
    ])
    .innerJoin('application.job', 'job')
    .addSelect(['job.id', 'job.title', 'job.clientId'])
    .leftJoin('job.client', 'client')
    .addSelect(['client.id', 'client.name'])
    .where('application.organizationId = :organizationId', { organizationId })
    .orderBy('application.updatedAt', 'DESC')
    .take(200)
    .getMany();
  const byCandidate = new Map<string, ApplicationEntity>();
  for (const application of applications) {
    if (!byCandidate.has(application.candidateId)) {
      byCandidate.set(application.candidateId, application);
    }
  }
  const candidateApps = [...byCandidate.values()].slice(0, CANDIDATE_THREADS);

  const contacts = await dataSource
    .getRepository(ClientContactEntity)
    .createQueryBuilder('contact')
    .innerJoin('contact.client', 'client')
    .addSelect(['client.id', 'client.name'])
    .where('contact.organizationId = :organizationId', { organizationId })
    .andWhere('contact.email IS NOT NULL')
    .orderBy('contact.createdAt', 'ASC')
    .getMany();
  const jobsByClient = new Map<string, string[]>();
  for (const application of applications) {
    if (application.job.clientId) {
      const titles = jobsByClient.get(application.job.clientId) ?? [];
      titles.push(application.job.title);
      jobsByClient.set(application.job.clientId, titles);
    }
  }
  const colleagues = await dataSource
    .getRepository(UserEntity)
    .createQueryBuilder('user')
    .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
    .where('user.organizationId = :organizationId', { organizationId })
    .andWhere('user.id != :adminId', { adminId: admin.id })
    .andWhere("user.email LIKE '%@rabbithr.test'")
    .getMany();

  const plans: ThreadPlan[] = [];
  candidateApps.forEach((application, index) => {
    const { candidate, job } = application;
    const them: Party = {
      email: candidate.email,
      name: `${candidate.firstName} ${candidate.lastName}`,
      firstName: candidate.firstName,
    };
    const scripts = candidateScripts(
      job.title,
      job.client?.name ?? 'our client',
      them,
      me,
    );
    plans.push({
      script: scripts[index % scripts.length],
      counterpart: them,
      cc: [],
      candidateId: candidate.id,
      clientId: job.clientId,
      clientContactId: null,
      applicationId: application.id,
      folder: index % 9 === 8 ? EmailFolder.ARCHIVE : EmailFolder.INBOX,
    });
  });
  contacts.slice(0, CLIENT_THREADS).forEach((contact, index) => {
    const them: Party = {
      email: contact.email!,
      name: `${contact.firstName} ${contact.lastName ?? ''}`.trim(),
      firstName: contact.firstName,
    };
    const job = pick(jobsByClient.get(contact.clientId) ?? ['Support Worker']);
    const scripts = clientScripts(job, them, me);
    const colleague =
      colleagues.length && chance(0.4) ? pick(colleagues) : null;
    plans.push({
      script: scripts[index % scripts.length],
      counterpart: them,
      cc: colleague
        ? [
            {
              email: colleague.email,
              name: `${colleague.firstName} ${colleague.lastName}`,
              firstName: colleague.firstName ?? '',
            },
          ]
        : [],
      candidateId: null,
      clientId: contact.clientId,
      clientContactId: contact.id,
      applicationId: null,
      folder: index % 6 === 5 ? EmailFolder.ARCHIVE : EmailFolder.INBOX,
    });
  });
  for (const item of UNLINKED) {
    plans.push({
      script: {
        subject: item.subject,
        steps: [{ from: 'them', body: item.body }],
      },
      counterpart: item.from,
      cc: [],
      candidateId: null,
      clientId: null,
      clientContactId: null,
      applicationId: null,
      folder: EmailFolder.INBOX,
    });
  }

  let messageCount = 0;
  let activityCount = 0;
  for (const [threadIndex, plan] of plans.entries()) {
    const providerThreadId = `${DEMO_PREFIX}thread-${threadIndex + 1}`;
    const span = plan.script.steps.length;
    let at = NOW - int(1, 29) * DAY - int(0, 20) * HOUR;
    const latestStart = NOW - span * 6 * HOUR;
    if (at > latestStart) at = latestStart;

    const thread = await threadRepo.save(
      threadRepo.create({
        organizationId,
        mailboxId: mailbox.id,
        providerThreadId,
        subject: plan.script.subject,
        lastMessageAt: new Date(at),
        candidateId: plan.candidateId,
        clientId: plan.clientId,
        applicationId: plan.applicationId,
        folder: plan.folder,
      }),
    );

    const messages: EmailMessageEntity[] = [];
    let previousId: string | null = null;
    const references: string[] = [];
    for (const [stepIndex, step] of plan.script.steps.entries()) {
      if (stepIndex > 0) {
        at += Math.round(
          (0.3 + rand() * (step.from === 'me' ? 18 : 30)) * HOUR,
        );
        if (at > NOW - 10 * 60 * 1000) at = NOW - int(10, 90) * 60 * 1000;
      }
      const outbound = step.from === 'me';
      const isLast = stepIndex === span - 1;
      const internetMessageId = `<${DEMO_PREFIX}${threadIndex + 1}-${stepIndex + 1}@${DEMO_DOMAIN}>`;
      const from = outbound ? me : plan.counterpart;
      const to = outbound ? [plan.counterpart] : [me];
      const subject =
        stepIndex === 0 ? plan.script.subject : `Re: ${plan.script.subject}`;
      const isRead = outbound || !isLast || chance(0.45);
      const folder =
        plan.folder === EmailFolder.ARCHIVE
          ? EmailFolder.ARCHIVE
          : outbound
            ? EmailFolder.SENT
            : EmailFolder.INBOX;
      messages.push(
        messageRepo.create({
          organizationId,
          mailboxId: mailbox.id,
          threadId: thread.id,
          providerMessageId: `${DEMO_PREFIX}msg-${threadIndex + 1}-${stepIndex + 1}`,
          internetMessageId,
          fromAddress: from.email.toLowerCase(),
          fromName: from.name,
          to: to.map(participant),
          cc: plan.cc.map(participant),
          bcc: [],
          subject,
          bodyText: step.body,
          bodyHtml: toHtml(step.body),
          snippet: snippet(step.body),
          sentAt: new Date(at),
          receivedAt: outbound ? null : new Date(at),
          isRead,
          isOutbound: outbound,
          direction: outbound
            ? EmailDirection.OUTBOUND
            : EmailDirection.INBOUND,
          folder,
          labels: outbound
            ? ['SENT']
            : isRead
              ? ['INBOX']
              : ['INBOX', 'UNREAD'],
          hasAttachments: !!step.attachment,
          attachments: step.attachment ? [step.attachment] : [],
          inReplyTo: previousId,
          references: references.length ? references.join(' ') : null,
          candidateId: plan.candidateId,
          clientId: plan.clientId,
          clientContactId: plan.clientContactId,
          sentByUserId: outbound ? admin.id : null,
          deliveryStatus: outbound ? EmailDeliveryStatus.DEMO : null,
        }),
      );
      previousId = internetMessageId;
      references.push(internetMessageId);
    }
    const saved = await messageRepo.save(messages);
    messageCount += saved.length;

    const last = saved[saved.length - 1];
    const allOutbound = saved.every((message) => message.isOutbound);
    const participants = new Map<string, EmailParticipant>();
    for (const message of saved) {
      for (const p of [
        { email: message.fromAddress, name: message.fromName },
        ...message.to,
        ...message.cc,
      ]) {
        if (!participants.has(p.email)) participants.set(p.email, p);
      }
    }
    thread.snippet = last.snippet;
    thread.lastMessageAt = last.sentAt;
    thread.messageCount = saved.length;
    thread.unreadCount = saved.filter((m) => !m.isOutbound && !m.isRead).length;
    thread.hasAttachments = saved.some((m) => m.hasAttachments);
    thread.labels = [...new Set(saved.flatMap((m) => m.labels))];
    thread.participants = [...participants.values()];
    thread.folder =
      plan.folder === EmailFolder.ARCHIVE
        ? EmailFolder.ARCHIVE
        : allOutbound
          ? EmailFolder.SENT
          : EmailFolder.INBOX;
    thread.isArchived = thread.folder === EmailFolder.ARCHIVE;
    await threadRepo.save(thread);

    if (plan.candidateId || plan.clientId) {
      const activities = saved.map((message) =>
        activityRepo.create({
          organizationId,
          candidateId: plan.candidateId,
          clientId: plan.clientId,
          applicationId: plan.applicationId,
          type: ActivityType.EMAIL,
          title:
            `${message.isOutbound ? 'Email sent' : 'Email received'}: ${message.subject}`.slice(
              0,
              250,
            ),
          body: message.snippet,
          metadata: {
            source: 'inbox',
            demo: true,
            emailMessageId: message.id,
            threadId: thread.id,
            mailboxId: mailbox.id,
            direction: message.direction,
            from: message.fromAddress,
            to: message.to.map((p) => p.email),
            subject: message.subject,
          },
          actorId: message.sentByUserId,
          createdAt: message.sentAt,
        }),
      );
      await activityRepo.save(activities);
      activityCount += activities.length;
    }
  }

  console.log(
    `Seeded demo inbox: ${plans.length} threads, ${messageCount} messages, ${activityCount} email activities`,
  );
}
