import { MigrationInterface, QueryRunner } from 'typeorm';

export class FreePlan1794650000000 implements MigrationInterface {
  name = 'FreePlan1794650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "organizations" SET "plan" = 'free', "subscriptionStatus" = 'active', "trialEndsAt" = NULL WHERE "plan" IS NULL AND "isSystemOrg" = false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "organizations" SET "plan" = NULL WHERE "plan" = 'free' AND "dodoSubscriptionId" IS NULL`,
    );
  }
}
