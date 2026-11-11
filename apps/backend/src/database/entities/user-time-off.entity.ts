import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('user_time_off')
@Index(['organizationId', 'userId', 'startsAt'])
export class UserTimeOffEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({ type: 'boolean', default: false })
  allDay: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
