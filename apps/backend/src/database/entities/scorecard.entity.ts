import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { InterviewEntity } from './interview.entity';
import { ScorecardRecommendation } from '../enums';

export interface ScorecardCriterion {
  name: string;
  rating: number;
  note?: string | null;
}

@Entity('interview_scorecards')
@Index(['interviewId', 'interviewerId'], { unique: true })
@Index(['organizationId', 'applicationId'])
export class ScorecardEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid' })
  interviewId: string;

  @Column({ type: 'uuid' })
  applicationId: string;

  @Column({ type: 'uuid' })
  interviewerId: string;

  @Column({ type: 'int' })
  overallRating: number;

  @Column({ type: 'enum', enum: ScorecardRecommendation })
  recommendation: ScorecardRecommendation;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  criteria: ScorecardCriterion[];

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => InterviewEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interviewId' })
  interview: InterviewEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'interviewerId' })
  interviewer: UserEntity;
}
