import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ClientEntity } from './client.entity';

@Entity('client_contacts')
@Index(['organizationId', 'clientId'])
export class ClientContactEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  jobTitle: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @ManyToOne(() => ClientEntity, (client) => client.contacts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;
}
