import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { ClientContactEntity } from './client-contact.entity';
import { ClientStatus } from '../enums';

export interface ClientAddress {
  street?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
}

export interface ClientBilling {
  contactName?: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
  currency?: string;
}

@Entity('clients')
@Index(['organizationId', 'status'])
@Index(['organizationId', 'name'])
export class ClientEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  legalName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', nullable: true })
  address: ClientAddress | null;

  @Column({ type: 'jsonb', nullable: true })
  billing: ClientBilling | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  brandColor: string | null;

  @Column({ type: 'enum', enum: ClientStatus, default: ClientStatus.ACTIVE })
  status: ClientStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  ownerId: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ownerId' })
  owner: UserEntity | null;

  @OneToMany(() => ClientContactEntity, (contact) => contact.client)
  contacts: ClientContactEntity[];
}
