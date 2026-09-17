-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ASSESSOR', 'TECHNICIAN', 'CLIENT');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ControlAssessmentStatus" AS ENUM ('NOT_ASSESSED', 'NOT_STARTED', 'IN_PROGRESS', 'IMPLEMENTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('SCREENSHOT', 'POLICY', 'BACKUP_REPORT', 'VULNERABILITY_REPORT', 'SECURITY_AWARENESS_REPORT', 'CONFIGURATION_EXPORT', 'TICKET', 'EXTERNAL_URL', 'ASSESSMENT_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "RemediationStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'ACCEPTED_RISK');

-- CreateEnum
CREATE TYPE "RemediationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ASSESSOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "primaryContact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "industry" TEXT,
    "employeeCount" INTEGER,
    "endpointCount" INTEGER,
    "serverCount" INTEGER,
    "location" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frameworks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "framework_requirements" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "framework_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controls" (
    "id" TEXT NOT NULL,
    "controlNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "guidance" TEXT,
    "category" TEXT,
    "isDeprecated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_framework_mappings" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "frameworkRequirementId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_framework_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "assessmentDate" TIMESTAMP(3),
    "startedDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "assessorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_frameworks" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_assessments" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "status" "ControlAssessmentStatus" NOT NULL DEFAULT 'NOT_ASSESSED',
    "isApplicable" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT,
    "assessorId" TEXT,
    "notes" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "controlAssessmentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "evidenceType" "EvidenceType" NOT NULL DEFAULT 'OTHER',
    "fileReference" TEXT,
    "externalUrl" TEXT,
    "dateCollected" TIMESTAMP(3),
    "collectedById" TEXT,
    "reviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remediation_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "controlAssessmentId" TEXT,
    "ownerId" TEXT,
    "priority" "RemediationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "RemediationStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "remediation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "organizations_name_idx" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "frameworks_slug_key" ON "frameworks"("slug");

-- CreateIndex
CREATE INDEX "framework_requirements_frameworkId_idx" ON "framework_requirements"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "framework_requirements_frameworkId_code_key" ON "framework_requirements"("frameworkId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "controls_controlNumber_key" ON "controls"("controlNumber");

-- CreateIndex
CREATE INDEX "controls_category_idx" ON "controls"("category");

-- CreateIndex
CREATE INDEX "control_framework_mappings_frameworkRequirementId_idx" ON "control_framework_mappings"("frameworkRequirementId");

-- CreateIndex
CREATE UNIQUE INDEX "control_framework_mappings_controlId_frameworkRequirementId_key" ON "control_framework_mappings"("controlId", "frameworkRequirementId");

-- CreateIndex
CREATE INDEX "assessments_organizationId_idx" ON "assessments"("organizationId");

-- CreateIndex
CREATE INDEX "assessment_frameworks_frameworkId_idx" ON "assessment_frameworks"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_frameworks_assessmentId_frameworkId_key" ON "assessment_frameworks"("assessmentId", "frameworkId");

-- CreateIndex
CREATE INDEX "control_assessments_controlId_idx" ON "control_assessments"("controlId");

-- CreateIndex
CREATE INDEX "control_assessments_status_idx" ON "control_assessments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "control_assessments_assessmentId_controlId_key" ON "control_assessments"("assessmentId", "controlId");

-- CreateIndex
CREATE INDEX "evidence_controlAssessmentId_idx" ON "evidence"("controlAssessmentId");

-- CreateIndex
CREATE INDEX "remediation_items_organizationId_idx" ON "remediation_items"("organizationId");

-- CreateIndex
CREATE INDEX "remediation_items_status_idx" ON "remediation_items"("status");

-- CreateIndex
CREATE INDEX "remediation_items_dueDate_idx" ON "remediation_items"("dueDate");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "framework_requirements" ADD CONSTRAINT "framework_requirements_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_framework_mappings" ADD CONSTRAINT "control_framework_mappings_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_framework_mappings" ADD CONSTRAINT "control_framework_mappings_frameworkRequirementId_fkey" FOREIGN KEY ("frameworkRequirementId") REFERENCES "framework_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_frameworks" ADD CONSTRAINT "assessment_frameworks_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_frameworks" ADD CONSTRAINT "assessment_frameworks_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_assessments" ADD CONSTRAINT "control_assessments_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_assessments" ADD CONSTRAINT "control_assessments_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "controls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_assessments" ADD CONSTRAINT "control_assessments_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_assessments" ADD CONSTRAINT "control_assessments_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_controlAssessmentId_fkey" FOREIGN KEY ("controlAssessmentId") REFERENCES "control_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remediation_items" ADD CONSTRAINT "remediation_items_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remediation_items" ADD CONSTRAINT "remediation_items_controlAssessmentId_fkey" FOREIGN KEY ("controlAssessmentId") REFERENCES "control_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remediation_items" ADD CONSTRAINT "remediation_items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
