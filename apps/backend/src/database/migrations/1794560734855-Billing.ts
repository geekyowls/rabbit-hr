import { MigrationInterface, QueryRunner } from 'typeorm';

export class Billing1794560734855 implements MigrationInterface {
  name = 'Billing1794560734855';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "billing_webhook_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "provider" character varying(20) NOT NULL, "webhookId" character varying(200) NOT NULL, "eventType" character varying(100) NOT NULL, "organizationId" uuid, CONSTRAINT "PK_a4c2d2eae68da905a0b6063d0ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a8787309f4edf4a5b35075edc6" ON "billing_webhook_events" ("provider", "webhookId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "plan" character varying(20)`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_billinginterval_enum" AS ENUM('month', 'year')`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "billingInterval" "public"."organizations_billinginterval_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "dodoSubscriptionId" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "memberLimitOverride" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "pastDueSince" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "pastDueSince"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "cancelAtPeriodEnd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "memberLimitOverride"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "dodoSubscriptionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "billingInterval"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."organizations_billinginterval_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "plan"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8787309f4edf4a5b35075edc6"`,
    );
    await queryRunner.query(`DROP TABLE "billing_webhook_events"`);
  }
}
