import { Entity, Column, OneToMany, Index } from 'typeorm';

import {
  AtsDateFormat,
  BillingInterval,
  OrganizationStatus,
  PdfTemplate,
  OrgSubscriptionStatus,
  SalaryPeriod,
} from '../enums';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import type { AgencySize, OrgFeatureControls } from '@boilerplate/core';

export interface OrganizationMetadata {
  agencySize?: AgencySize;
  onboardingDismissedAt?: string;
  sampleData?: OrganizationSampleData;
}

export interface OrganizationSampleData {
  createdAt: string;
  clientIds: string[];
  jobIds: string[];
  candidateIds: string[];
}

export interface OrganizationAtsSettings {
  defaultCurrency: string;
  country: string;
  timezone: string;
  dateFormat: AtsDateFormat;
  locale: string;
  weekStartsOn: 0 | 1;
  salaryPeriodDefault: SalaryPeriod;
  departments: string[];
  portalEnabled: boolean;
  portalWelcomeMessage: string;
  brandColor: string | null;
}

export const DEFAULT_ATS_SETTINGS: OrganizationAtsSettings = {
  defaultCurrency: 'USD',
  country: 'US',
  timezone: 'UTC',
  dateFormat: AtsDateFormat.MDY,
  locale: 'en-US',
  weekStartsOn: 0,
  salaryPeriodDefault: SalaryPeriod.YEAR,
  departments: [],
  portalEnabled: false,
  portalWelcomeMessage: '',
  brandColor: null,
};

export function resolveAtsSettings(
  stored: Partial<OrganizationAtsSettings> | null | undefined,
): OrganizationAtsSettings {
  return { ...DEFAULT_ATS_SETTINGS, ...(stored ?? {}) };
}

@Entity('organizations')
@Index(['slug'], { unique: true })
@Index(['domain'], { unique: true })
export class OrganizationEntity extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  slug!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  domain!: string;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status!: OrganizationStatus;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  logo!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  phone!: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  email!: string | null;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  website!: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  address!: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  } | null;

  @Column({
    type: 'enum',
    enum: PdfTemplate,
    default: PdfTemplate.DEFAULT,
  })
  pdfTemplate!: PdfTemplate;

  @Column({
    type: 'boolean',
    default: false,
  })
  isSystemOrg!: boolean;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  privacyPolicyUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  termsAndConditionsUrl!: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  clientAppConfig!: {
    showGoogleLogin?: boolean;
    showAppleLogin?: boolean;
    primaryColor?: string;
    hideDietitianName?: boolean;
  } | null;

  @Column({
    type: 'enum',
    enum: OrgSubscriptionStatus,
    default: OrgSubscriptionStatus.TRIAL,
  })
  subscriptionStatus!: OrgSubscriptionStatus;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  dodoCustomerId!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  razorpayCustomerId!: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  trialEndsAt!: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  subscriptionEndsAt!: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  plan!: string | null;

  @Column({ type: 'enum', enum: BillingInterval, nullable: true })
  billingInterval!: BillingInterval | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dodoSubscriptionId!: string | null;

  @Column({ type: 'integer', nullable: true })
  memberLimitOverride!: number | null;

  @Column({ type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  pastDueSince!: Date | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  featureControls!: OrgFeatureControls | null;

  @Column({ type: 'jsonb', nullable: true })
  invoiceSettings!: {
    prefix?: string;
    defaultNotes?: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: OrganizationMetadata | null;

  @Column({ type: 'jsonb', nullable: true })
  atsSettings!: Partial<OrganizationAtsSettings> | null;

  @Column({ type: 'text', nullable: true, select: false })
  appleIapSharedSecret!: string | null;

  @OneToMany(() => UserEntity, (user) => user.organization, {
    cascade: false,
  })
  users!: UserEntity[];
}
