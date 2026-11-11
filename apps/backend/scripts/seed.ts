import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { ALL_PERMISSIONS } from '@boilerplate/core';
import AppDataSource from '../src/database/data-source';
import { seedAts } from './seed-ats';
import { seedAtsPhase2 } from './seed-ats-phase2';
import { seedAtsPhase2b } from './seed-ats-phase2b';
import { seedAtsPhase3c } from './seed-ats-phase3c';
import { seedAtsPhase3a } from './seed-ats-phase3a';
import { seedAtsPhase3b } from './seed-ats-phase3b';
import {
  UserEntity,
  OrganizationEntity,
  RoleEntity,
  SupportedIntegrationEntity,
} from '../src/database/entities';
import {
  OrganizationStatus,
  OrgSubscriptionStatus,
  UserStatus,
  IntegrationCategory,
  IntegrationAuthType,
} from '../src/database/enums';

interface SeedAccount {
  orgName: string;
  slug: string;
  domain: string;
  isSystemOrg: boolean;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const ACCOUNTS: SeedAccount[] = [
  {
    orgName: 'RabbitHR',
    slug: 'rabbithr',
    domain: 'rabbithr.rabbithr.app',
    isSystemOrg: true,
    email: 'admin@rabbithr.test',
    password: 'Admin@123',
    firstName: 'System',
    lastName: 'Admin',
  },
  {
    orgName: 'Acme Inc',
    slug: 'acme',
    domain: 'acme.rabbithr.app',
    isSystemOrg: false,
    email: 'owner@acme.test',
    password: 'Owner@123',
    firstName: 'Alex',
    lastName: 'Owner',
  },
];

const INTEGRATIONS = [
  {
    provider: 'google_calendar',
    name: 'Google Calendar',
    description:
      'Sync interviews to Google Calendar and create Google Meet links',
    iconUrl: '/integrations/google-calendar.svg',
    category: IntegrationCategory.CALENDAR,
    authType: IntegrationAuthType.OAUTH,
    sortOrder: 1,
  },
  {
    provider: 'zoom',
    name: 'Zoom',
    description: 'Create Zoom meeting links for interviews',
    iconUrl: '/integrations/zoom.svg',
    category: IntegrationCategory.VIDEO_CONFERENCING,
    authType: IntegrationAuthType.OAUTH,
    sortOrder: 2,
  },
  {
    provider: 'slack',
    name: 'Slack',
    description: 'Send notifications and updates to Slack channels',
    iconUrl: '/integrations/slack.svg',
    category: IntegrationCategory.MESSAGING,
    authType: IntegrationAuthType.OAUTH,
    sortOrder: 3,
  },
  {
    provider: 'microsoft_teams',
    name: 'Microsoft 365',
    description:
      'Sync interviews to Outlook calendar and create Microsoft Teams meeting links',
    iconUrl: '/integrations/microsoft-teams.svg',
    category: IntegrationCategory.CALENDAR,
    authType: IntegrationAuthType.OAUTH,
    sortOrder: 4,
  },
];

async function seed() {
  await AppDataSource.initialize();

  const orgRepo = AppDataSource.getRepository(OrganizationEntity);
  const roleRepo = AppDataSource.getRepository(RoleEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);
  const integrationRepo = AppDataSource.getRepository(
    SupportedIntegrationEntity,
  );

  for (const integration of INTEGRATIONS) {
    const existing = await integrationRepo.findOne({
      where: { provider: integration.provider },
    });
    if (existing) {
      existing.iconUrl = integration.iconUrl;
      existing.name = integration.name;
      existing.description = integration.description;
      existing.category = integration.category;
      await integrationRepo.save(existing);
      console.log(`Updated integration: ${integration.name}`);
      continue;
    }
    await integrationRepo.save(
      integrationRepo.create({ ...integration, isActive: true }),
    );
    console.log(`Created integration: ${integration.name}`);
  }

  for (const account of ACCOUNTS) {
    const existing = await userRepo.findOne({
      where: { email: account.email },
    });
    if (existing) {
      console.log(`User ${account.email} already exists. Skipping.`);
      continue;
    }

    const organization = await orgRepo.save(
      orgRepo.create({
        name: account.orgName,
        slug: account.slug,
        domain: account.domain,
        status: OrganizationStatus.ACTIVE,
        subscriptionStatus: OrgSubscriptionStatus.ACTIVE,
        isSystemOrg: account.isSystemOrg,
      }),
    );

    const role = await roleRepo.save(
      roleRepo.create({
        name: 'Admin',
        permissions: ALL_PERMISSIONS,
        organizationId: organization.id,
        isDefault: true,
      }),
    );

    const password = await bcrypt.hash(account.password, 10);

    await userRepo.save(
      userRepo.create({
        email: account.email,
        password,
        firstName: account.firstName,
        lastName: account.lastName,
        organizationId: organization.id,
        roleId: role.id,
        status: UserStatus.ACTIVE,
        isActive: true,
      }),
    );

    const kind = account.isSystemOrg ? 'system admin' : 'org admin';
    console.log(`Created ${kind}: ${account.email} / ${account.password}`);
  }

  const systemAccount = ACCOUNTS.find((a) => a.isSystemOrg)!;
  const adminUser = await userRepo.findOne({
    where: { email: systemAccount.email },
  });
  if (adminUser) {
    const organization = await orgRepo.findOne({
      where: { id: adminUser.organizationId },
    });
    const adminRole = await roleRepo.findOne({
      where: { organizationId: adminUser.organizationId, isDefault: true },
    });
    if (organization && adminRole) {
      adminRole.permissions = ALL_PERMISSIONS;
      await roleRepo.save(adminRole);
      console.log(
        `Synced ${adminRole.name} role permissions for ${organization.name}`,
      );

      const atsContext = {
        organizationId: organization.id,
        adminUserId: adminUser.id,
        adminRoleId: adminRole.id,
      };
      await seedAts(AppDataSource, atsContext);
      await seedAtsPhase2(AppDataSource, atsContext);
      await seedAtsPhase2b(AppDataSource, atsContext);
      await seedAtsPhase3c(AppDataSource, atsContext);
      await seedAtsPhase3a(AppDataSource, atsContext);
      await seedAtsPhase3b(AppDataSource, atsContext);

      console.log(
        `Careers page slug: ${organization.slug} (GET /api/v1/public/careers/${organization.slug}/jobs)`,
      );
    }
  }

  console.log('Seed complete.');
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
