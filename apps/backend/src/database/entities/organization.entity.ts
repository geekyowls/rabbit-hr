import { Entity, Column, OneToMany, Index } from 'typeorm';

import {
  OrganizationStatus,
  PdfTemplate,
  OrgSubscriptionStatus,
} from '../enums';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import type { OrgFeatureControls } from '@boilerplate/core';

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

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  featureControls!: OrgFeatureControls | null;

  @Column({ type: 'jsonb', nullable: true })
  invoiceSettings!: {
    prefix?: string;
    defaultNotes?: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: {
    practiceType?: 'solo' | 'team';
    teamSize?: '2-5' | '6-10' | '11-25' | '25+';
  } | null;

  @Column({ type: 'text', nullable: true, select: false })
  appleIapSharedSecret!: string | null;

  @OneToMany(() => UserEntity, (user) => user.organization, {
    cascade: false,
  })
  users!: UserEntity[];
}
