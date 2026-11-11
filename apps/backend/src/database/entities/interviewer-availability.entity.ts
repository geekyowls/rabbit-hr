import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

export interface WeeklyHoursInterval {
  day: number;
  start: string;
  end: string;
}

@Entity('interviewer_availability')
@Index(['organizationId', 'userId'], { unique: true })
export class InterviewerAvailabilityEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 64 })
  timezone: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  weeklyHours: WeeklyHoursInterval[];

  @Column({ type: 'int', default: 0 })
  bufferMinutes: number;

  @Column({ type: 'int', default: 240 })
  minNoticeMinutes: number;

  @Column({ type: 'int', default: 30 })
  maxDaysAhead: number;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
