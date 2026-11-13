import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1794479875703 implements MigrationInterface {
  name = 'Baseline1794479875703';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_status_enum" AS ENUM('active', 'inactive', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_pdftemplate_enum" AS ENUM('default', 'variation-2', 'variation-3', 'variation-4', 'weekly-grid', 'two-column', 'plain-grid', 'clinic-table', 'mono-minimal', 'compact-list')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organizations_subscriptionstatus_enum" AS ENUM('trial', 'active', 'past_due', 'grace', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(200) NOT NULL, "slug" character varying(100) NOT NULL, "domain" character varying(100) NOT NULL, "status" "public"."organizations_status_enum" NOT NULL DEFAULT 'active', "logo" character varying(500), "phone" character varying(20), "email" character varying(200), "website" character varying(200), "address" jsonb, "pdfTemplate" "public"."organizations_pdftemplate_enum" NOT NULL DEFAULT 'default', "isSystemOrg" boolean NOT NULL DEFAULT false, "privacyPolicyUrl" character varying(500), "termsAndConditionsUrl" character varying(500), "clientAppConfig" jsonb, "subscriptionStatus" "public"."organizations_subscriptionstatus_enum" NOT NULL DEFAULT 'trial', "dodoCustomerId" character varying(100), "razorpayCustomerId" character varying(100), "trialEndsAt" TIMESTAMP, "subscriptionEndsAt" TIMESTAMP, "featureControls" jsonb DEFAULT '{}', "invoiceSettings" jsonb, "metadata" jsonb, "atsSettings" jsonb, "appleIapSharedSecret" text, CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_98678ed828cc71e4f8a58c95d6" ON "organizations" ("domain") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_963693341bd612aa01ddf3a4b6" ON "organizations" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "permissions" jsonb NOT NULL DEFAULT '[]', "organizationId" uuid NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d27a5e69fb41256abed347a85e" ON "roles" ("name", "organizationId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('invited', 'active', 'inactive', 'blocked')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "password" character varying(255), "firstName" character varying(100), "lastName" character varying(100), "phone" character varying(32), "phoneCountryCode" character varying(8) DEFAULT 'IN', "organizationId" uuid NOT NULL, "status" "public"."users_status_enum" NOT NULL DEFAULT 'invited', "isActive" boolean NOT NULL DEFAULT false, "onboarded" boolean NOT NULL DEFAULT false, "passwordResetToken" character varying(255), "passwordResetExpires" TIMESTAMP, "inviteToken" character varying(255), "inviteExpires" TIMESTAMP, "refreshToken" character varying, "refreshTokenExpires" TIMESTAMP, "refreshTokenJti" uuid, "invitedBy" uuid, "roleId" uuid, "tourCompleted" boolean NOT NULL DEFAULT false, "lastReEngagementEmailAt" TIMESTAMP, "managerId" uuid, "path" character varying(1000), "metadata" jsonb, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ddfb7904324cdba38d3c73de93" ON "users" ("email", "organizationId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_configs_type_enum" AS ENUM('client_tag', 'message_template', 'medical_condition', 'allergy', 'health_objective')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "type" "public"."organization_configs_type_enum" NOT NULL, "name" character varying(100) NOT NULL, "value" jsonb, "isDefault" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_0e6129975214409ba4fb54579c0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e548870d9efa0e16b3de62790" ON "organization_configs" ("organizationId", "type") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_32d115ef47f2d38edd341e61f5" ON "organization_configs" ("organizationId", "type", "name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid, "actorId" uuid, "impersonatedBy" uuid, "method" character varying(10) NOT NULL, "path" character varying(255) NOT NULL, "action" character varying(100) NOT NULL, "statusCode" integer NOT NULL, "metadata" jsonb, "ipAddress" character varying(45), "userAgent" character varying(500), "duration" integer, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cee5459245f652b75eb2759b4c" ON "audit_logs" ("action") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2dc33f7f3c22e2e7badafca1d1" ON "audit_logs" ("actorId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9885c0f9a2e4081ebae4313d87" ON "audit_logs" ("organizationId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."supported_integrations_category_enum" AS ENUM('calendar', 'video_conferencing', 'messaging', 'productivity', 'ai', 'telephony', 'payments')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."supported_integrations_authtype_enum" AS ENUM('oauth', 'api_key')`,
    );
    await queryRunner.query(
      `CREATE TABLE "supported_integrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "provider" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "iconUrl" character varying(255), "category" "public"."supported_integrations_category_enum" NOT NULL DEFAULT 'productivity', "authType" "public"."supported_integrations_authtype_enum" NOT NULL DEFAULT 'oauth', "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_9f3f9628f9d371f5898133a3003" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9191add53b38b4d3f07d8f2ea7" ON "supported_integrations" ("provider") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_integrations_status_enum" AS ENUM('connected', 'disconnected', 'expired', 'error')`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_integrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "supportedIntegrationId" uuid NOT NULL, "status" "public"."organization_integrations_status_enum" NOT NULL DEFAULT 'connected', "encryptedTokens" text NOT NULL, "tokenExpiresAt" TIMESTAMP, "connectedBy" uuid NOT NULL, "accountEmail" character varying(255), "accountName" character varying(255), "lastSyncAt" TIMESTAMP, "errorMessage" text, "webhookToken" character varying(255), CONSTRAINT "PK_5abc5a509e1ed4dd30abc1f2604" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_edaf8f2488d12d04954d4948a1" ON "organization_integrations" ("webhookToken") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_57c8dd5fee4774865ffea5cecd" ON "organization_integrations" ("organizationId", "supportedIntegrationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "organizationId" uuid NOT NULL, "otp" character varying(6) NOT NULL, "resetToken" character varying(255), "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_0b4f4c493a1ee383f93ff3a5017" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_38903c4160113c1160bd90c99b" ON "password_reset_otps" ("resetToken") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5ce8a9f67a86cfd0785a9ba89" ON "password_reset_otps" ("email", "organizationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "otp_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "targetType" character varying(16) NOT NULL, "target" character varying(255) NOT NULL, "purpose" character varying(32) NOT NULL, "organizationId" uuid NOT NULL, "codeHash" character varying(128) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "attempts" integer NOT NULL DEFAULT '0', "consumed" boolean NOT NULL DEFAULT false, "failed" boolean NOT NULL DEFAULT false, "resetToken" character varying(255), "resetTokenExpiresAt" TIMESTAMP, CONSTRAINT "PK_9d0487965ac1837d57fec4d6a26" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6053bd16bc504d09a213116e18" ON "otp_codes" ("resetToken") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_03e5350fad73bf2a43d02685d5" ON "otp_codes" ("target", "purpose", "organizationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "email_verifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "otpCode" character varying(10) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "verified" boolean NOT NULL DEFAULT false, "attempts" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_c1ea2921e767f83cd44c0af203f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_44e5cfea68f87243cad38bb1b1" ON "email_verifications" ("email") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "organizationId" uuid NOT NULL, "jti" uuid NOT NULL, "userAgent" character varying(500), "ipAddress" character varying(64), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revokedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_705c76591465aa6943b60551cd" ON "user_sessions" ("jti") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83264d35a590615280397a856c" ON "user_sessions" ("userId", "revokedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_55fa4db8406ed66bc704432842" ON "user_sessions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "recipientUserId" uuid NOT NULL, "type" character varying(100) NOT NULL, "title" character varying(200) NOT NULL, "body" text NOT NULL, "link" character varying(500), "priority" character varying(20) NOT NULL DEFAULT 'info', "data" jsonb, "isRead" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b6b29b39990196af27ac8927e7" ON "notifications" ("organizationId", "recipientUserId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b093191a8e22153fe7dd4c9e42" ON "notifications" ("organizationId", "recipientUserId", "isRead") `,
    );
    await queryRunner.query(
      `CREATE TABLE "web_push_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "userId" uuid NOT NULL, "endpoint" text NOT NULL, "p256dh" character varying(255) NOT NULL, "auth" character varying(255) NOT NULL, "userAgent" character varying(255), CONSTRAINT "PK_8fdd353125d839be247dfdd8caa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_92aa70cad0f08382b5ebb87704" ON "web_push_subscriptions" ("endpoint") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_db44ebc83cab368c619d09daa2" ON "web_push_subscriptions" ("organizationId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "client_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "clientId" uuid NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100), "email" character varying(255), "phone" character varying(40), "jobTitle" character varying(150), "isPrimary" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_1d0ab11dc872cb18d4850c970a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e8e65de4fff50d32be8c4ecb7" ON "client_contacts" ("organizationId", "clientId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clients_status_enum" AS ENUM('active', 'retired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "name" character varying(200) NOT NULL, "legalName" character varying(200), "industry" character varying(120), "website" character varying(300), "phone" character varying(40), "email" character varying(255), "address" jsonb, "billing" jsonb, "logoUrl" character varying(500), "brandColor" character varying(20), "status" "public"."clients_status_enum" NOT NULL DEFAULT 'active', "notes" text, "ownerId" uuid, CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff739cd498040bdc641b6bb76c" ON "clients" ("organizationId", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d27844806e5b334bae7a50259" ON "clients" ("organizationId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_employmenttype_enum" AS ENUM('permanent', 'temporary', 'contract')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_workmode_enum" AS ENUM('onsite', 'hybrid', 'remote')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_rateunit_enum" AS ENUM('hour', 'day', 'year')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."jobs_status_enum" AS ENUM('draft', 'published', 'on_hold', 'closed', 'filled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "reference" character varying(20) NOT NULL, "clientId" uuid, "title" character varying(200) NOT NULL, "description" text, "requirements" text, "employmentType" "public"."jobs_employmenttype_enum" NOT NULL DEFAULT 'permanent', "workMode" "public"."jobs_workmode_enum" NOT NULL DEFAULT 'onsite', "location" character varying(200), "salaryMin" numeric(12,2), "salaryMax" numeric(12,2), "payRate" numeric(12,2), "chargeRate" numeric(12,2), "rateUnit" "public"."jobs_rateunit_enum", "currency" character varying(3) NOT NULL DEFAULT 'GBP', "openings" integer NOT NULL DEFAULT '1', "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'draft', "ownerId" uuid, "closingDate" date, "publishedAt" TIMESTAMP, "skills" text array NOT NULL DEFAULT '{}', "screeningQuestions" jsonb NOT NULL DEFAULT '[]', "requiredDocuments" text array NOT NULL DEFAULT '{}', "department" character varying(100), "hiringManagerId" uuid, "recruiterId" uuid, "hiringTeamIds" uuid array NOT NULL DEFAULT '{}', "customFields" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_202052d90f21c15704a8bd6105" ON "jobs" ("organizationId", "department") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_17d31b9e4a469dbed890a1ae65" ON "jobs" ("organizationId", "clientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_42aed577f56d87411f11c0cd43" ON "jobs" ("organizationId", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_058f382d199c7a1822d011ff6f" ON "jobs" ("organizationId", "reference") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidates_source_enum" AS ENUM('careers_page', 'linkedin', 'indeed', 'reed', 'totaljobs', 'cv_library', 'referral', 'agency_database', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidates_righttowork_enum" AS ENUM('unknown', 'uk_citizen', 'settled_status', 'visa_sponsorship_required', 'work_visa')`,
    );
    await queryRunner.query(
      `CREATE TABLE "candidates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "phone" character varying(40), "location" character varying(200), "headline" character varying(250), "currentTitle" character varying(150), "currentEmployer" character varying(150), "yearsExperience" integer, "skills" text array NOT NULL DEFAULT '{}', "tags" text array NOT NULL DEFAULT '{}', "source" "public"."candidates_source_enum" NOT NULL DEFAULT 'other', "cvFileKey" character varying(500), "cvFileName" character varying(255), "linkedinUrl" character varying(300), "expectedSalary" numeric(12,2), "noticePeriod" character varying(100), "rightToWork" "public"."candidates_righttowork_enum" NOT NULL DEFAULT 'unknown', "gdprConsentAt" TIMESTAMP, "ownerId" uuid, "rating" integer, "customFields" jsonb NOT NULL DEFAULT '{}', "portalInvitedAt" TIMESTAMP WITH TIME ZONE, "portalLastLoginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ef11c314d698fb1f774047422d" ON "candidates" ("organizationId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_06cb3a14600de021f89d1089b0" ON "candidates" ("organizationId", "email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."applications_source_enum" AS ENUM('careers_page', 'linkedin', 'indeed', 'reed', 'totaljobs', 'cv_library', 'referral', 'agency_database', 'other')`,
    );
    await queryRunner.query(
      `CREATE TABLE "applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "candidateId" uuid NOT NULL, "jobId" uuid NOT NULL, "stage" character varying(64) NOT NULL DEFAULT 'applied', "rejectionReason" character varying(500), "rating" integer, "shortlisted" boolean NOT NULL DEFAULT false, "source" "public"."applications_source_enum" NOT NULL DEFAULT 'other', "answers" jsonb, "stageChangedAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, "appliedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d0f7f4568339a78c1b2e771bf6" ON "applications" ("organizationId", "appliedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72d7d87376e5aad86c90fd03cf" ON "applications" ("organizationId", "jobId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e453a8fc4438c2111482aaaea" ON "applications" ("organizationId", "stage") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b005ac451f3e0550c2c8cb5bba" ON "applications" ("candidateId", "jobId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activities_type_enum" AS ENUM('note', 'stage_change', 'email', 'call', 'created', 'document', 'task', 'interview', 'offer', 'whatsapp', 'portal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "candidateId" uuid, "applicationId" uuid, "jobId" uuid, "clientId" uuid, "type" "public"."activities_type_enum" NOT NULL, "title" character varying(250) NOT NULL, "body" text, "metadata" jsonb, "actorId" uuid, CONSTRAINT "PK_7f4004429f731ffb9c88eb486a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93fc27fed7715e09020555aa2d" ON "activities" ("organizationId", "clientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6f77b1f3d6543d882c684ed863" ON "activities" ("organizationId", "jobId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6936ec6f356deb51b5ddfa646" ON "activities" ("organizationId", "applicationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e639a926b04cd92f994c8df96c" ON "activities" ("organizationId", "candidateId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3be5a1cd1440a9d121e1051e5c" ON "activities" ("organizationId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_status_enum" AS ENUM('open', 'done')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "title" character varying(250) NOT NULL, "description" text, "dueAt" TIMESTAMP, "assigneeId" uuid, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'open', "completedAt" TIMESTAMP, "candidateId" uuid, "applicationId" uuid, "jobId" uuid, "clientId" uuid, "createdBy" uuid, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_115d47e84b420d65f93132fa60" ON "tasks" ("organizationId", "assigneeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_728955e7fe97b068e5480dfae9" ON "tasks" ("organizationId", "status", "dueAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidate_documents_type_enum" AS ENUM('cv', 'id', 'right_to_work', 'reference', 'certificate', 'dbs', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidate_documents_verificationstatus_enum" AS ENUM('pending', 'verified', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "candidate_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "candidateId" uuid NOT NULL, "applicationId" uuid, "type" "public"."candidate_documents_type_enum" NOT NULL DEFAULT 'other', "name" character varying(200) NOT NULL, "fileKey" character varying(500) NOT NULL, "fileName" character varying(255) NOT NULL, "mimeType" character varying(150), "sizeBytes" integer, "verificationStatus" "public"."candidate_documents_verificationstatus_enum" NOT NULL DEFAULT 'pending', "verifiedBy" uuid, "verifiedAt" TIMESTAMP, "expiresAt" date, "notes" text, CONSTRAINT "PK_a7b7572a2c5c1320a4249ce2b4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_14e300a538e3c7fa78cb8ee85c" ON "candidate_documents" ("organizationId", "candidateId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."email_templates_category_enum" AS ENUM('invite', 'rejection', 'offer', 'interview', 'general')`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "name" character varying(150) NOT NULL, "category" "public"."email_templates_category_enum" NOT NULL DEFAULT 'general', "subject" character varying(300) NOT NULL, "body" text NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_06c564c515d8cdb40b6f3bfbbb4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1ce155c9823b4507c8f3cf9c28" ON "email_templates" ("organizationId", "category") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."pipeline_stages_category_enum" AS ENUM('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')`,
    );
    await queryRunner.query(
      `CREATE TABLE "pipeline_stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "key" character varying(64) NOT NULL, "name" character varying(100) NOT NULL, "order" integer NOT NULL DEFAULT '0', "category" "public"."pipeline_stages_category_enum" NOT NULL, "color" character varying(32) NOT NULL DEFAULT 'slate', "isSystem" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_92e43270eace072ad5182fc08e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c03ba6a5752fc5e4cbc2150b1e" ON "pipeline_stages" ("organizationId", "order") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f9e4d3e03692017eccf3df2c05" ON "pipeline_stages" ("organizationId", "key") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."custom_field_definitions_entity_enum" AS ENUM('candidate', 'job')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."custom_field_definitions_type_enum" AS ENUM('text', 'textarea', 'number', 'date', 'select', 'multiselect', 'boolean', 'url')`,
    );
    await queryRunner.query(
      `CREATE TABLE "custom_field_definitions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "entity" "public"."custom_field_definitions_entity_enum" NOT NULL, "key" character varying(64) NOT NULL, "label" character varying(100) NOT NULL, "type" "public"."custom_field_definitions_type_enum" NOT NULL, "options" text array NOT NULL DEFAULT '{}', "required" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "showOnCareersForm" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_91f4cf6416f7aeb02c217005cb2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1eccad190161b03b550a46d1ea" ON "custom_field_definitions" ("organizationId", "entity", "order") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_eb1678f31f64760b36dcafce31" ON "custom_field_definitions" ("organizationId", "entity", "key") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interviews_type_enum" AS ENUM('phone', 'video', 'onsite', 'technical', 'panel', 'assessment', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interviews_meetingprovider_enum" AS ENUM('none', 'google_meet', 'zoom', 'teams', 'manual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interviews_calendarsyncstatus_enum" AS ENUM('pending', 'synced', 'failed', 'skipped')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interviews_status_enum" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show')`,
    );
    await queryRunner.query(
      `CREATE TABLE "interviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "applicationId" uuid NOT NULL, "candidateId" uuid NOT NULL, "jobId" uuid NOT NULL, "title" character varying(200) NOT NULL, "type" "public"."interviews_type_enum" NOT NULL DEFAULT 'video', "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL, "durationMinutes" integer NOT NULL DEFAULT '60', "timezone" character varying(64) NOT NULL, "location" character varying(300), "meetingUrl" character varying(500), "meetingProvider" "public"."interviews_meetingprovider_enum" NOT NULL DEFAULT 'none', "meetingExternalId" character varying(255), "calendarProvider" character varying(50), "externalEventId" character varying(1024), "calendarSyncStatus" "public"."interviews_calendarsyncstatus_enum" NOT NULL DEFAULT 'skipped', "calendarSyncError" text, "calendarSyncedAt" TIMESTAMP WITH TIME ZONE, "interviewerIds" uuid array NOT NULL DEFAULT '{}', "organizerId" uuid, "status" "public"."interviews_status_enum" NOT NULL DEFAULT 'scheduled', "notes" text, "cancelledReason" character varying(500), CONSTRAINT "PK_fd41af1f96d698fa33c2f070f47" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_16534c23bf145fcd54e3acdc0e" ON "interviews" ("organizationId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc05e991bf25dc684224dd25d7" ON "interviews" ("organizationId", "candidateId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11a9b3998e3dad841b2749f58a" ON "interviews" ("organizationId", "jobId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5c0f5447cbeddb1f62427d38c3" ON "interviews" ("organizationId", "applicationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ea5920ca3cc6a70ad6c6acbdbd" ON "interviews" ("organizationId", "scheduledAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interview_scorecards_recommendation_enum" AS ENUM('strong_yes', 'yes', 'no', 'strong_no')`,
    );
    await queryRunner.query(
      `CREATE TABLE "interview_scorecards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "interviewId" uuid NOT NULL, "applicationId" uuid NOT NULL, "interviewerId" uuid NOT NULL, "overallRating" integer NOT NULL, "recommendation" "public"."interview_scorecards_recommendation_enum" NOT NULL, "criteria" jsonb NOT NULL DEFAULT '[]', "summary" text, "submittedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c93dc9aca7cce55a2fd86be919c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f9fbbead5f599302480c1df37" ON "interview_scorecards" ("organizationId", "applicationId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_88a9c5f53f59a326bf66585b99" ON "interview_scorecards" ("interviewId", "interviewerId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."offers_status_enum" AS ENUM('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'accepted', 'declined', 'withdrawn', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."offers_salaryperiod_enum" AS ENUM('year', 'month', 'day', 'hour')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."offers_employmenttype_enum" AS ENUM('permanent', 'temporary', 'contract')`,
    );
    await queryRunner.query(
      `CREATE TABLE "offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "applicationId" uuid NOT NULL, "candidateId" uuid NOT NULL, "jobId" uuid NOT NULL, "status" "public"."offers_status_enum" NOT NULL DEFAULT 'draft', "title" character varying(200) NOT NULL, "salaryAmount" numeric(14,2), "currency" character varying(3) NOT NULL, "salaryPeriod" "public"."offers_salaryperiod_enum" NOT NULL DEFAULT 'year', "bonus" character varying(200), "equity" text, "startDate" date, "expiresAt" date, "employmentType" "public"."offers_employmenttype_enum", "location" character varying(200), "body" text, "approverIds" uuid array NOT NULL DEFAULT '{}', "approvals" jsonb NOT NULL DEFAULT '[]', "sentAt" TIMESTAMP WITH TIME ZONE, "respondedAt" TIMESTAMP WITH TIME ZONE, "declineReason" character varying(500), "signToken" character varying(64), "signTokenExpiresAt" TIMESTAMP WITH TIME ZONE, "sentLetterBody" text, "signedAt" TIMESTAMP WITH TIME ZONE, "signedName" character varying(200), "signedIp" character varying(64), "signedUserAgent" character varying(500), "signatureHash" character varying(64), "createdBy" uuid, CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cc63098a7393caa71a8fb7dfd8" ON "offers" ("signToken") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7261067263a12e28692762a4f0" ON "offers" ("organizationId", "candidateId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e2dc37bc7c9606181c0501d0b" ON "offers" ("organizationId", "jobId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f0c239940681cf027f38584987" ON "offers" ("organizationId", "applicationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81800b15e24863e34b3029195d" ON "offers" ("organizationId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidate_calls_direction_enum" AS ENUM('outbound', 'inbound')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidate_calls_status_enum" AS ENUM('initiated', 'completed', 'no_answer', 'busy', 'failed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."candidate_calls_disposition_enum" AS ENUM('connected', 'no_answer', 'voicemail', 'busy', 'wrong_number', 'interested', 'not_interested', 'callback_requested')`,
    );
    await queryRunner.query(
      `CREATE TABLE "candidate_calls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "candidateId" uuid NOT NULL, "applicationId" uuid, "actorId" uuid, "provider" character varying(30) NOT NULL DEFAULT 'plivo', "requestUuid" character varying(100), "callUuid" character varying(100), "direction" "public"."candidate_calls_direction_enum" NOT NULL DEFAULT 'outbound', "status" "public"."candidate_calls_status_enum" NOT NULL DEFAULT 'initiated', "hangupCause" character varying(100), "fromNumber" character varying(30), "toNumber" character varying(30), "staffNumber" character varying(30), "durationSeconds" integer NOT NULL DEFAULT '0', "billDurationSeconds" integer, "startedAt" TIMESTAMP WITH TIME ZONE, "endedAt" TIMESTAMP WITH TIME ZONE, "disposition" "public"."candidate_calls_disposition_enum", "note" text, "recordingUrl" character varying(1000), "recordingDurationSeconds" integer, "activityId" uuid, CONSTRAINT "PK_5bae41810118e095315807a34ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_08d80c484b93c8a3be74d14cd1" ON "candidate_calls" ("requestUuid") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fbeefc46d83ac124d73acf6d6a" ON "candidate_calls" ("callUuid") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_80b797dad43b8e8bc1308604fe" ON "candidate_calls" ("organizationId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7047c172c07eafbd1521054351" ON "candidate_calls" ("organizationId", "candidateId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "whatsapp_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "provider" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "language" character varying(20) NOT NULL DEFAULT '', "category" character varying(50), "status" character varying(50), "body" text, "variableKeys" jsonb NOT NULL DEFAULT '[]', "mapping" jsonb NOT NULL DEFAULT '{}', "label" character varying(100), "availableAtProvider" boolean NOT NULL DEFAULT true, "addedManually" boolean NOT NULL DEFAULT false, "unsupportedReason" character varying(255), "lastSyncedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_73154f2b6ebc019bc3461ee14eb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0b93bb3d84d0819bc150ccc295" ON "whatsapp_templates" ("organizationId", "provider", "name", "language") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."whatsapp_messages_status_enum" AS ENUM('queued', 'sent', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "whatsapp_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "provider" character varying(50) NOT NULL, "templateId" uuid, "templateName" character varying(255) NOT NULL, "candidateId" uuid NOT NULL, "applicationId" uuid, "phone" character varying(30) NOT NULL, "variables" jsonb NOT NULL DEFAULT '{}', "renderedBody" text, "status" "public"."whatsapp_messages_status_enum" NOT NULL DEFAULT 'queued', "errorCategory" character varying(40), "errorMessage" text, "providerMessageId" character varying(255), "dedupeKey" character varying(255), "sentBy" uuid, "sentAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_807bc612c6b98de7645a99805ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc1728325e765ba53e51377767" ON "whatsapp_messages" ("organizationId", "dedupeKey") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e9f3cb4805b4c18a825d6879ee" ON "whatsapp_messages" ("organizationId", "candidateId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_afd6f1db22f810ed525e0beae0" ON "whatsapp_messages" ("organizationId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "job_feeds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "enabled" boolean NOT NULL DEFAULT false, "token" character varying(64) NOT NULL, "includeClientNames" boolean NOT NULL DEFAULT true, "lastAccessedAt" TIMESTAMP WITH TIME ZONE, "updatedBy" uuid, CONSTRAINT "PK_cdb8e98f7be858459e52d032f70" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_60326dad85266e8fd443c980f9" ON "job_feeds" ("token") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ba4a46c8cab217570fbb2ec72f" ON "job_feeds" ("organizationId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."mailbox_connections_provider_enum" AS ENUM('gmail', 'outlook')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."mailbox_connections_status_enum" AS ENUM('connected', 'disconnected', 'expired', 'error')`,
    );
    await queryRunner.query(
      `CREATE TABLE "mailbox_connections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "userId" uuid, "connectedById" uuid, "provider" "public"."mailbox_connections_provider_enum" NOT NULL, "emailAddress" character varying(320) NOT NULL, "displayName" character varying(200), "isShared" boolean NOT NULL DEFAULT false, "encryptedTokens" text, "tokenExpiresAt" TIMESTAMP WITH TIME ZONE, "status" "public"."mailbox_connections_status_enum" NOT NULL DEFAULT 'connected', "errorMessage" text, "syncCursor" text, "lastSyncedAt" TIMESTAMP WITH TIME ZONE, "syncEnabled" boolean NOT NULL DEFAULT true, "isDemo" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3dbbad5c86703ed00daee00ce90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0af5ae790aa86782dea4e0e64" ON "mailbox_connections" ("organizationId", "userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_fee44380167e5d02feeb977ebc" ON "mailbox_connections" ("organizationId", "provider", "emailAddress") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."email_threads_folder_enum" AS ENUM('inbox', 'sent', 'drafts', 'archive', 'trash')`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_threads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "mailboxId" uuid NOT NULL, "providerThreadId" character varying(255) NOT NULL, "subject" character varying(500) NOT NULL DEFAULT '', "snippet" character varying(500) NOT NULL DEFAULT '', "participants" jsonb NOT NULL DEFAULT '[]', "lastMessageAt" TIMESTAMP WITH TIME ZONE NOT NULL, "unreadCount" integer NOT NULL DEFAULT '0', "messageCount" integer NOT NULL DEFAULT '0', "hasAttachments" boolean NOT NULL DEFAULT false, "folder" "public"."email_threads_folder_enum" NOT NULL DEFAULT 'inbox', "labels" jsonb NOT NULL DEFAULT '[]', "candidateId" uuid, "clientId" uuid, "applicationId" uuid, "isArchived" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_1f14199869568a456ff0bdc86a9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f71f0489a7c494f44b662b3232" ON "email_threads" ("organizationId", "clientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_302633daf961116d57ed56d975" ON "email_threads" ("organizationId", "candidateId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e2caa850a32a2697d66b4db4d7" ON "email_threads" ("organizationId", "mailboxId", "folder", "lastMessageAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_82c86ee69db82ed1a37e0253b8" ON "email_threads" ("mailboxId", "providerThreadId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."email_messages_direction_enum" AS ENUM('inbound', 'outbound')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."email_messages_folder_enum" AS ENUM('inbox', 'sent', 'drafts', 'archive', 'trash')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."email_messages_deliverystatus_enum" AS ENUM('sent', 'demo')`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "mailboxId" uuid NOT NULL, "threadId" uuid NOT NULL, "providerMessageId" character varying(255) NOT NULL, "internetMessageId" character varying(500), "fromAddress" character varying(320) NOT NULL, "fromName" character varying(200), "to" jsonb NOT NULL DEFAULT '[]', "cc" jsonb NOT NULL DEFAULT '[]', "bcc" jsonb NOT NULL DEFAULT '[]', "subject" character varying(500) NOT NULL DEFAULT '', "bodyText" text, "bodyHtml" text, "snippet" character varying(500) NOT NULL DEFAULT '', "sentAt" TIMESTAMP WITH TIME ZONE NOT NULL, "receivedAt" TIMESTAMP WITH TIME ZONE, "isRead" boolean NOT NULL DEFAULT false, "isOutbound" boolean NOT NULL DEFAULT false, "direction" "public"."email_messages_direction_enum" NOT NULL, "folder" "public"."email_messages_folder_enum" NOT NULL DEFAULT 'inbox', "labels" jsonb NOT NULL DEFAULT '[]', "hasAttachments" boolean NOT NULL DEFAULT false, "attachments" jsonb NOT NULL DEFAULT '[]', "inReplyTo" character varying(500), "references" text, "candidateId" uuid, "clientId" uuid, "clientContactId" uuid, "sentByUserId" uuid, "deliveryStatus" "public"."email_messages_deliverystatus_enum", CONSTRAINT "PK_922cad79d5a315f5d1d06b077da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_628a7b0028ece5a96a9c33ca62" ON "email_messages" ("organizationId", "candidateId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a731dbd7ea1aa4802f7f9f2c8c" ON "email_messages" ("organizationId", "sentByUserId", "sentAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d92bacc1736053750fe3cb5661" ON "email_messages" ("threadId", "sentAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e62246d69f9ea89a5a2802af0" ON "email_messages" ("mailboxId", "internetMessageId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0331c126388b24ae7571d9473d" ON "email_messages" ("mailboxId", "providerMessageId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "interviewer_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "userId" uuid NOT NULL, "timezone" character varying(64) NOT NULL, "weeklyHours" jsonb NOT NULL DEFAULT '[]', "bufferMinutes" integer NOT NULL DEFAULT '0', "minNoticeMinutes" integer NOT NULL DEFAULT '240', "maxDaysAhead" integer NOT NULL DEFAULT '30', CONSTRAINT "PK_d0756cddf5548b165ea43e0d8b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_83fc7a29e3199ed6100d4c8047" ON "interviewer_availability" ("organizationId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_time_off" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "userId" uuid NOT NULL, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "allDay" boolean NOT NULL DEFAULT false, "reason" character varying(200), "createdBy" uuid, CONSTRAINT "PK_5f101b71e5fccf89cc8d434d0a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5f0e3123f42b8a38c39dc434da" ON "user_time_off" ("organizationId", "userId", "startsAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interview_booking_links_type_enum" AS ENUM('phone', 'video', 'onsite', 'technical', 'panel', 'assessment', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interview_booking_links_mode_enum" AS ENUM('any_interviewer', 'all_interviewers')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interview_booking_links_meetingprovider_enum" AS ENUM('none', 'google_meet', 'zoom', 'teams', 'manual')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."interview_booking_links_status_enum" AS ENUM('open', 'booked', 'cancelled', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "interview_booking_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "applicationId" uuid NOT NULL, "candidateId" uuid NOT NULL, "jobId" uuid NOT NULL, "token" character varying(64) NOT NULL, "title" character varying(200) NOT NULL, "type" "public"."interview_booking_links_type_enum" NOT NULL DEFAULT 'video', "durationMinutes" integer NOT NULL DEFAULT '30', "interviewerIds" uuid array NOT NULL DEFAULT '{}', "mode" "public"."interview_booking_links_mode_enum" NOT NULL DEFAULT 'any_interviewer', "meetingProvider" "public"."interview_booking_links_meetingprovider_enum" NOT NULL DEFAULT 'none', "location" character varying(300), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."interview_booking_links_status_enum" NOT NULL DEFAULT 'open', "bookedInterviewId" uuid, "bookedAt" TIMESTAMP WITH TIME ZONE, "cancelledAt" TIMESTAMP WITH TIME ZONE, "createdBy" uuid, CONSTRAINT "PK_1914c90d1b690ca749e7444f2e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_c3d78f19ef6274565f07ad7242" ON "interview_booking_links" ("token") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ba3aa0f668a4560c3b6e958d9" ON "interview_booking_links" ("organizationId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2bb9ab326f8a601e2ae963f03c" ON "interview_booking_links" ("organizationId", "applicationId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "candidate_portal_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid NOT NULL, "candidateId" uuid NOT NULL, "jti" uuid NOT NULL, "userAgent" character varying(500), "ipAddress" character varying(64), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "revokedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_833e7ee56dcceea255c16c785b1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e4dd3ed98f2d926ca935ebaf10" ON "candidate_portal_sessions" ("jti") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad5c8957ec9db06c1730ece6f4" ON "candidate_portal_sessions" ("organizationId", "candidateId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_0933e1dfb2993d672af1a98f08e" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_51dbc5eb6b6072bf1b06fea8d84" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_874662e039ab7d31a71450eb501" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_configs" ADD CONSTRAINT "FK_fe563ce1f48daefa2046fe55a58" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_integrations" ADD CONSTRAINT "FK_aeeab9c78c73c37d4d89082ed9a" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_integrations" ADD CONSTRAINT "FK_b8959c792efc26f1edc38047a4a" FOREIGN KEY ("supportedIntegrationId") REFERENCES "supported_integrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_integrations" ADD CONSTRAINT "FK_8c9e85fe34c36784539aec3f999" FOREIGN KEY ("connectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_55fa4db8406ed66bc7044328427" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_4f21b4ab8f9c137f62718843782" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_928914a0743f50e6f83a90cdda9" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_0be815cabd15a62a5546a4b1357" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_push_subscriptions" ADD CONSTRAINT "FK_0e281588ad649c71251b69b034c" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_push_subscriptions" ADD CONSTRAINT "FK_2f7e016b74a8907afb89b267b0a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_contacts" ADD CONSTRAINT "FK_b12571ed31604ee44ce5bc8c893" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_8d3cec4a5221398155c784ff78d" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_17c0b2073ebd7875388fa98ab19" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_08bdc8b939f39e6d55b4c38cfb9" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_e638bfcae652e31c8a92ebac147" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_f56229956adaac39fa9864f5f59" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_72d6d90344b47bb270ea66fbb34" FOREIGN KEY ("hiringManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_80472a2d1a7369d39f241c5f5f2" FOREIGN KEY ("recruiterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD CONSTRAINT "FK_d56a47318062e86ca2585103afb" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD CONSTRAINT "FK_d6e46b19105258d79ab1590080f" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_630548134611c66a73c8b82bc1c" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" ADD CONSTRAINT "FK_d88cfc3ec1f66c6c7b55d79f025" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_b8168e2c3e209999463d40cead5" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_fff10f98e3bd71516e67319ea1c" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_0223cd9b24de304ef223e4172bb" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_e59642c04bd3b5aa7b8cd4a909b" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_fc9d6236c8a32fecdd82fae816a" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" ADD CONSTRAINT "FK_6d64140609adc1f8c5e6d2e7b3f" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_a9a5a9fada64fc56e2aaf2f9464" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_47af643a8e915cb6366793db384" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_e6c7b5018b99bdedbd43a9ee549" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_f215ca000db56953a67baa23034" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_4e7cd3aff0dbd7708e02b14ecb8" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" ADD CONSTRAINT "FK_2593c8a7526e53ad6e424562ce6" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" ADD CONSTRAINT "FK_48147b042fe71b39a02e2625ee4" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" ADD CONSTRAINT "FK_885bb547391a9c87c9c10992999" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" ADD CONSTRAINT "FK_ec13f8dd9022a68b95ca846611d" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_templates" ADD CONSTRAINT "FK_24d69bfdefc871d61cb9a24587b" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pipeline_stages" ADD CONSTRAINT "FK_2a9b9ce49efceb6e159e5bba7c2" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "FK_73e59b25c920a007044c594d5a1" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_8cf1a0367209ecf220b3ff78bf2" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_ba82c76bf124871821aedc35b7a" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_9b47fb5a4e06ccb14d20d2f06fd" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_86c6a5b65c91b118189dc011aaa" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" ADD CONSTRAINT "FK_2191978c1eeebaef85e5e82325c" FOREIGN KEY ("organizerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_scorecards" ADD CONSTRAINT "FK_c64c698dfed01c1ba337326907e" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_scorecards" ADD CONSTRAINT "FK_c781c730cae389e4eccfa4c42df" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_scorecards" ADD CONSTRAINT "FK_092d5dad8b2835d6ff1270738c2" FOREIGN KEY ("interviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_531330d7396291798408abcc800" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_6d911e68442dac48e56f96a93a3" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_37e9cd61999f7733c4fbdfb34c3" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_4017be0f2811f53a9ac56a9bf16" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" ADD CONSTRAINT "FK_967c99a695f54eb74a5cd20e53e" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" ADD CONSTRAINT "FK_42da12017a70ed8313476f8fb95" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" ADD CONSTRAINT "FK_7fbb2e9ae1bab0825034851892e" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" ADD CONSTRAINT "FK_489ffc02ac5e4e5664d0d24e16b" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" ADD CONSTRAINT "FK_f97104e24d40dcd960b69ea4949" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_templates" ADD CONSTRAINT "FK_6bb9c11427c0c44bea8dc7cdea3" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "FK_2a68a1a93e283c9061953ca9cec" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "FK_348968fd450f79d4c232026fd2c" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "FK_e5dd1cf45accb5dd79e84bbd83c" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "FK_806a8441c436c7ffa27b379deac" FOREIGN KEY ("templateId") REFERENCES "whatsapp_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "FK_22824018ef14231dce7748448d2" FOREIGN KEY ("sentBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_feeds" ADD CONSTRAINT "FK_ba4a46c8cab217570fbb2ec72f1" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mailbox_connections" ADD CONSTRAINT "FK_90d512862f2a94cc0dec13146da" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mailbox_connections" ADD CONSTRAINT "FK_c87b16d91389e60ec48067d803b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mailbox_connections" ADD CONSTRAINT "FK_f5657cf52537669813e0404328a" FOREIGN KEY ("connectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" ADD CONSTRAINT "FK_7e3aae7f55286209bea47da6121" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" ADD CONSTRAINT "FK_fef99785255d126c46fb8f8fbf1" FOREIGN KEY ("mailboxId") REFERENCES "mailbox_connections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" ADD CONSTRAINT "FK_c6ae23194233fd7a9511ada6503" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" ADD CONSTRAINT "FK_71addaf42411583b6db0f0358c9" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" ADD CONSTRAINT "FK_4cc78de5edec2299fc5983a08b3" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_90cf6cb6599afd4df20248259ec" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_6bd43f74fea55340c806b64b0b7" FOREIGN KEY ("mailboxId") REFERENCES "mailbox_connections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_e49034b357246e8633a1faf908a" FOREIGN KEY ("threadId") REFERENCES "email_threads"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_5375dfc8ada349c3d0cccd19c61" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_3eff0f1cdf070ecf71bb6536fe9" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_71c7ac0074d60f0357d05a32123" FOREIGN KEY ("clientContactId") REFERENCES "client_contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" ADD CONSTRAINT "FK_9b4acd448a561204c57cece794e" FOREIGN KEY ("sentByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviewer_availability" ADD CONSTRAINT "FK_8bc0229d1b82e5e3dc4eb6d056b" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviewer_availability" ADD CONSTRAINT "FK_1e6af72c93ce156882adb4b0666" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_time_off" ADD CONSTRAINT "FK_8d16ac3409f2fbadd4fb6218d5f" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_time_off" ADD CONSTRAINT "FK_4505711eec5758b2b264e407407" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" ADD CONSTRAINT "FK_e93a5b2e201cb1e82e87c5fc304" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" ADD CONSTRAINT "FK_5c7d363b83939c836dbd7c0d03a" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" ADD CONSTRAINT "FK_7fb79db1e5b27c16ede35f47a20" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" ADD CONSTRAINT "FK_d39ba5c8910358e5c82d392a554" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" ADD CONSTRAINT "FK_a346ab4e0a520591a8747dbe523" FOREIGN KEY ("bookedInterviewId") REFERENCES "interviews"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" ADD CONSTRAINT "FK_f9c4a2f09159a3db4997a0c8627" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_portal_sessions" ADD CONSTRAINT "FK_ac84052f0a514b8a08b36132bef" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_portal_sessions" ADD CONSTRAINT "FK_b80610b11d211793d96ae1f092a" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidate_portal_sessions" DROP CONSTRAINT "FK_b80610b11d211793d96ae1f092a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_portal_sessions" DROP CONSTRAINT "FK_ac84052f0a514b8a08b36132bef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" DROP CONSTRAINT "FK_f9c4a2f09159a3db4997a0c8627"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" DROP CONSTRAINT "FK_a346ab4e0a520591a8747dbe523"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" DROP CONSTRAINT "FK_d39ba5c8910358e5c82d392a554"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" DROP CONSTRAINT "FK_7fb79db1e5b27c16ede35f47a20"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" DROP CONSTRAINT "FK_5c7d363b83939c836dbd7c0d03a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_booking_links" DROP CONSTRAINT "FK_e93a5b2e201cb1e82e87c5fc304"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_time_off" DROP CONSTRAINT "FK_4505711eec5758b2b264e407407"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_time_off" DROP CONSTRAINT "FK_8d16ac3409f2fbadd4fb6218d5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviewer_availability" DROP CONSTRAINT "FK_1e6af72c93ce156882adb4b0666"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviewer_availability" DROP CONSTRAINT "FK_8bc0229d1b82e5e3dc4eb6d056b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_9b4acd448a561204c57cece794e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_71c7ac0074d60f0357d05a32123"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_3eff0f1cdf070ecf71bb6536fe9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_5375dfc8ada349c3d0cccd19c61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_e49034b357246e8633a1faf908a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_6bd43f74fea55340c806b64b0b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_messages" DROP CONSTRAINT "FK_90cf6cb6599afd4df20248259ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" DROP CONSTRAINT "FK_4cc78de5edec2299fc5983a08b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" DROP CONSTRAINT "FK_71addaf42411583b6db0f0358c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" DROP CONSTRAINT "FK_c6ae23194233fd7a9511ada6503"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" DROP CONSTRAINT "FK_fef99785255d126c46fb8f8fbf1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_threads" DROP CONSTRAINT "FK_7e3aae7f55286209bea47da6121"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mailbox_connections" DROP CONSTRAINT "FK_f5657cf52537669813e0404328a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mailbox_connections" DROP CONSTRAINT "FK_c87b16d91389e60ec48067d803b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "mailbox_connections" DROP CONSTRAINT "FK_90d512862f2a94cc0dec13146da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_feeds" DROP CONSTRAINT "FK_ba4a46c8cab217570fbb2ec72f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "FK_22824018ef14231dce7748448d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "FK_806a8441c436c7ffa27b379deac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "FK_e5dd1cf45accb5dd79e84bbd83c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "FK_348968fd450f79d4c232026fd2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "FK_2a68a1a93e283c9061953ca9cec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "whatsapp_templates" DROP CONSTRAINT "FK_6bb9c11427c0c44bea8dc7cdea3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" DROP CONSTRAINT "FK_f97104e24d40dcd960b69ea4949"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" DROP CONSTRAINT "FK_489ffc02ac5e4e5664d0d24e16b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" DROP CONSTRAINT "FK_7fbb2e9ae1bab0825034851892e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_calls" DROP CONSTRAINT "FK_42da12017a70ed8313476f8fb95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" DROP CONSTRAINT "FK_967c99a695f54eb74a5cd20e53e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" DROP CONSTRAINT "FK_4017be0f2811f53a9ac56a9bf16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" DROP CONSTRAINT "FK_37e9cd61999f7733c4fbdfb34c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" DROP CONSTRAINT "FK_6d911e68442dac48e56f96a93a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offers" DROP CONSTRAINT "FK_531330d7396291798408abcc800"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_scorecards" DROP CONSTRAINT "FK_092d5dad8b2835d6ff1270738c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_scorecards" DROP CONSTRAINT "FK_c781c730cae389e4eccfa4c42df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interview_scorecards" DROP CONSTRAINT "FK_c64c698dfed01c1ba337326907e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_2191978c1eeebaef85e5e82325c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_86c6a5b65c91b118189dc011aaa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_9b47fb5a4e06ccb14d20d2f06fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_ba82c76bf124871821aedc35b7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "interviews" DROP CONSTRAINT "FK_8cf1a0367209ecf220b3ff78bf2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_field_definitions" DROP CONSTRAINT "FK_73e59b25c920a007044c594d5a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "pipeline_stages" DROP CONSTRAINT "FK_2a9b9ce49efceb6e159e5bba7c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_templates" DROP CONSTRAINT "FK_24d69bfdefc871d61cb9a24587b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" DROP CONSTRAINT "FK_ec13f8dd9022a68b95ca846611d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" DROP CONSTRAINT "FK_885bb547391a9c87c9c10992999"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" DROP CONSTRAINT "FK_48147b042fe71b39a02e2625ee4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidate_documents" DROP CONSTRAINT "FK_2593c8a7526e53ad6e424562ce6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_4e7cd3aff0dbd7708e02b14ecb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_f215ca000db56953a67baa23034"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_e6c7b5018b99bdedbd43a9ee549"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_47af643a8e915cb6366793db384"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_9a16d2c86252529f622fa53f1e3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_a9a5a9fada64fc56e2aaf2f9464"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_6d64140609adc1f8c5e6d2e7b3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_fc9d6236c8a32fecdd82fae816a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_e59642c04bd3b5aa7b8cd4a909b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_0223cd9b24de304ef223e4172bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_fff10f98e3bd71516e67319ea1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activities" DROP CONSTRAINT "FK_b8168e2c3e209999463d40cead5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_d88cfc3ec1f66c6c7b55d79f025"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_a34254e3f2b3d20f07f8dbd6322"`,
    );
    await queryRunner.query(
      `ALTER TABLE "applications" DROP CONSTRAINT "FK_630548134611c66a73c8b82bc1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "FK_d6e46b19105258d79ab1590080f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "FK_d56a47318062e86ca2585103afb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_80472a2d1a7369d39f241c5f5f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_72d6d90344b47bb270ea66fbb34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_f56229956adaac39fa9864f5f59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_e638bfcae652e31c8a92ebac147"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_08bdc8b939f39e6d55b4c38cfb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_17c0b2073ebd7875388fa98ab19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_8d3cec4a5221398155c784ff78d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_contacts" DROP CONSTRAINT "FK_b12571ed31604ee44ce5bc8c893"`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_push_subscriptions" DROP CONSTRAINT "FK_2f7e016b74a8907afb89b267b0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "web_push_subscriptions" DROP CONSTRAINT "FK_0e281588ad649c71251b69b034c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_0be815cabd15a62a5546a4b1357"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_928914a0743f50e6f83a90cdda9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_4f21b4ab8f9c137f62718843782"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_55fa4db8406ed66bc7044328427"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_integrations" DROP CONSTRAINT "FK_8c9e85fe34c36784539aec3f999"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_integrations" DROP CONSTRAINT "FK_b8959c792efc26f1edc38047a4a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_integrations" DROP CONSTRAINT "FK_aeeab9c78c73c37d4d89082ed9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_configs" DROP CONSTRAINT "FK_fe563ce1f48daefa2046fe55a58"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_874662e039ab7d31a71450eb501"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_51dbc5eb6b6072bf1b06fea8d84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_0933e1dfb2993d672af1a98f08e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad5c8957ec9db06c1730ece6f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e4dd3ed98f2d926ca935ebaf10"`,
    );
    await queryRunner.query(`DROP TABLE "candidate_portal_sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2bb9ab326f8a601e2ae963f03c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ba3aa0f668a4560c3b6e958d9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c3d78f19ef6274565f07ad7242"`,
    );
    await queryRunner.query(`DROP TABLE "interview_booking_links"`);
    await queryRunner.query(
      `DROP TYPE "public"."interview_booking_links_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."interview_booking_links_meetingprovider_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."interview_booking_links_mode_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."interview_booking_links_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5f0e3123f42b8a38c39dc434da"`,
    );
    await queryRunner.query(`DROP TABLE "user_time_off"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83fc7a29e3199ed6100d4c8047"`,
    );
    await queryRunner.query(`DROP TABLE "interviewer_availability"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0331c126388b24ae7571d9473d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e62246d69f9ea89a5a2802af0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d92bacc1736053750fe3cb5661"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a731dbd7ea1aa4802f7f9f2c8c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_628a7b0028ece5a96a9c33ca62"`,
    );
    await queryRunner.query(`DROP TABLE "email_messages"`);
    await queryRunner.query(
      `DROP TYPE "public"."email_messages_deliverystatus_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."email_messages_folder_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."email_messages_direction_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82c86ee69db82ed1a37e0253b8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e2caa850a32a2697d66b4db4d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_302633daf961116d57ed56d975"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f71f0489a7c494f44b662b3232"`,
    );
    await queryRunner.query(`DROP TABLE "email_threads"`);
    await queryRunner.query(`DROP TYPE "public"."email_threads_folder_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fee44380167e5d02feeb977ebc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0af5ae790aa86782dea4e0e64"`,
    );
    await queryRunner.query(`DROP TABLE "mailbox_connections"`);
    await queryRunner.query(
      `DROP TYPE "public"."mailbox_connections_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."mailbox_connections_provider_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba4a46c8cab217570fbb2ec72f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_60326dad85266e8fd443c980f9"`,
    );
    await queryRunner.query(`DROP TABLE "job_feeds"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_afd6f1db22f810ed525e0beae0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e9f3cb4805b4c18a825d6879ee"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc1728325e765ba53e51377767"`,
    );
    await queryRunner.query(`DROP TABLE "whatsapp_messages"`);
    await queryRunner.query(
      `DROP TYPE "public"."whatsapp_messages_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0b93bb3d84d0819bc150ccc295"`,
    );
    await queryRunner.query(`DROP TABLE "whatsapp_templates"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7047c172c07eafbd1521054351"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_80b797dad43b8e8bc1308604fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fbeefc46d83ac124d73acf6d6a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_08d80c484b93c8a3be74d14cd1"`,
    );
    await queryRunner.query(`DROP TABLE "candidate_calls"`);
    await queryRunner.query(
      `DROP TYPE "public"."candidate_calls_disposition_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."candidate_calls_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."candidate_calls_direction_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81800b15e24863e34b3029195d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f0c239940681cf027f38584987"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e2dc37bc7c9606181c0501d0b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7261067263a12e28692762a4f0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cc63098a7393caa71a8fb7dfd8"`,
    );
    await queryRunner.query(`DROP TABLE "offers"`);
    await queryRunner.query(`DROP TYPE "public"."offers_employmenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."offers_salaryperiod_enum"`);
    await queryRunner.query(`DROP TYPE "public"."offers_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88a9c5f53f59a326bf66585b99"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0f9fbbead5f599302480c1df37"`,
    );
    await queryRunner.query(`DROP TABLE "interview_scorecards"`);
    await queryRunner.query(
      `DROP TYPE "public"."interview_scorecards_recommendation_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ea5920ca3cc6a70ad6c6acbdbd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5c0f5447cbeddb1f62427d38c3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_11a9b3998e3dad841b2749f58a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cc05e991bf25dc684224dd25d7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_16534c23bf145fcd54e3acdc0e"`,
    );
    await queryRunner.query(`DROP TABLE "interviews"`);
    await queryRunner.query(`DROP TYPE "public"."interviews_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."interviews_calendarsyncstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."interviews_meetingprovider_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."interviews_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_eb1678f31f64760b36dcafce31"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1eccad190161b03b550a46d1ea"`,
    );
    await queryRunner.query(`DROP TABLE "custom_field_definitions"`);
    await queryRunner.query(
      `DROP TYPE "public"."custom_field_definitions_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."custom_field_definitions_entity_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f9e4d3e03692017eccf3df2c05"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c03ba6a5752fc5e4cbc2150b1e"`,
    );
    await queryRunner.query(`DROP TABLE "pipeline_stages"`);
    await queryRunner.query(
      `DROP TYPE "public"."pipeline_stages_category_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1ce155c9823b4507c8f3cf9c28"`,
    );
    await queryRunner.query(`DROP TABLE "email_templates"`);
    await queryRunner.query(
      `DROP TYPE "public"."email_templates_category_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_14e300a538e3c7fa78cb8ee85c"`,
    );
    await queryRunner.query(`DROP TABLE "candidate_documents"`);
    await queryRunner.query(
      `DROP TYPE "public"."candidate_documents_verificationstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."candidate_documents_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_728955e7fe97b068e5480dfae9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_115d47e84b420d65f93132fa60"`,
    );
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3be5a1cd1440a9d121e1051e5c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e639a926b04cd92f994c8df96c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a6936ec6f356deb51b5ddfa646"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6f77b1f3d6543d882c684ed863"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93fc27fed7715e09020555aa2d"`,
    );
    await queryRunner.query(`DROP TABLE "activities"`);
    await queryRunner.query(`DROP TYPE "public"."activities_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b005ac451f3e0550c2c8cb5bba"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e453a8fc4438c2111482aaaea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72d7d87376e5aad86c90fd03cf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d0f7f4568339a78c1b2e771bf6"`,
    );
    await queryRunner.query(`DROP TABLE "applications"`);
    await queryRunner.query(`DROP TYPE "public"."applications_source_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_06cb3a14600de021f89d1089b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ef11c314d698fb1f774047422d"`,
    );
    await queryRunner.query(`DROP TABLE "candidates"`);
    await queryRunner.query(`DROP TYPE "public"."candidates_righttowork_enum"`);
    await queryRunner.query(`DROP TYPE "public"."candidates_source_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_058f382d199c7a1822d011ff6f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_42aed577f56d87411f11c0cd43"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_17d31b9e4a469dbed890a1ae65"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_202052d90f21c15704a8bd6105"`,
    );
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_rateunit_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_workmode_enum"`);
    await queryRunner.query(`DROP TYPE "public"."jobs_employmenttype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d27844806e5b334bae7a50259"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff739cd498040bdc641b6bb76c"`,
    );
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(`DROP TYPE "public"."clients_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e8e65de4fff50d32be8c4ecb7"`,
    );
    await queryRunner.query(`DROP TABLE "client_contacts"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_db44ebc83cab368c619d09daa2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92aa70cad0f08382b5ebb87704"`,
    );
    await queryRunner.query(`DROP TABLE "web_push_subscriptions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b093191a8e22153fe7dd4c9e42"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b6b29b39990196af27ac8927e7"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_55fa4db8406ed66bc704432842"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83264d35a590615280397a856c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_705c76591465aa6943b60551cd"`,
    );
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_44e5cfea68f87243cad38bb1b1"`,
    );
    await queryRunner.query(`DROP TABLE "email_verifications"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03e5350fad73bf2a43d02685d5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6053bd16bc504d09a213116e18"`,
    );
    await queryRunner.query(`DROP TABLE "otp_codes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5ce8a9f67a86cfd0785a9ba89"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_38903c4160113c1160bd90c99b"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_otps"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57c8dd5fee4774865ffea5cecd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_edaf8f2488d12d04954d4948a1"`,
    );
    await queryRunner.query(`DROP TABLE "organization_integrations"`);
    await queryRunner.query(
      `DROP TYPE "public"."organization_integrations_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9191add53b38b4d3f07d8f2ea7"`,
    );
    await queryRunner.query(`DROP TABLE "supported_integrations"`);
    await queryRunner.query(
      `DROP TYPE "public"."supported_integrations_authtype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."supported_integrations_category_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9885c0f9a2e4081ebae4313d87"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2dc33f7f3c22e2e7badafca1d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cee5459245f652b75eb2759b4c"`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32d115ef47f2d38edd341e61f5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e548870d9efa0e16b3de62790"`,
    );
    await queryRunner.query(`DROP TABLE "organization_configs"`);
    await queryRunner.query(
      `DROP TYPE "public"."organization_configs_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ddfb7904324cdba38d3c73de93"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d27a5e69fb41256abed347a85e"`,
    );
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_963693341bd612aa01ddf3a4b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_98678ed828cc71e4f8a58c95d6"`,
    );
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(
      `DROP TYPE "public"."organizations_subscriptionstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."organizations_pdftemplate_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."organizations_status_enum"`);
  }
}
