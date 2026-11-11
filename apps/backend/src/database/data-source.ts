import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

import {
  UserEntity,
  OrganizationEntity,
  OrganizationConfigEntity,
  RoleEntity,
  AuditLogEntity,
  SupportedIntegrationEntity,
  OrganizationIntegrationEntity,
  PasswordResetOtpEntity,
  OtpCodeEntity,
  EmailVerificationEntity,
  UserSessionEntity,
  NotificationEntity,
  WebPushSubscriptionEntity,
  ClientEntity,
  ClientContactEntity,
  JobEntity,
  CandidateEntity,
  ApplicationEntity,
  ActivityEntity,
  TaskEntity,
  CandidateDocumentEntity,
  EmailTemplateEntity,
} from './entities';

dotenv.config({ path: join(__dirname, '../../.env') });

const entities = [
  UserEntity,
  OrganizationEntity,
  OrganizationConfigEntity,
  RoleEntity,
  AuditLogEntity,
  SupportedIntegrationEntity,
  OrganizationIntegrationEntity,
  PasswordResetOtpEntity,
  OtpCodeEntity,
  EmailVerificationEntity,
  UserSessionEntity,
  NotificationEntity,
  WebPushSubscriptionEntity,
  ClientEntity,
  ClientContactEntity,
  JobEntity,
  CandidateEntity,
  ApplicationEntity,
  ActivityEntity,
  TaskEntity,
  CandidateDocumentEntity,
  EmailTemplateEntity,
];

const isDev = process.env.NODE_ENV === 'development';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DB_URL,
  entities,
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: isDev ? true : ['error', 'warn'],
  maxQueryExecutionTime: isDev ? 500 : 1000,
};

export default new DataSource(dataSourceOptions);
