-- AlterTable
ALTER TABLE "control_assessments" ADD COLUMN     "inScope" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "organization_frameworks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organization_frameworks_frameworkId_idx" ON "organization_frameworks"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_frameworks_organizationId_frameworkId_key" ON "organization_frameworks"("organizationId", "frameworkId");

-- CreateIndex
CREATE INDEX "control_assessments_assessmentId_inScope_idx" ON "control_assessments"("assessmentId", "inScope");

-- AddForeignKey
ALTER TABLE "organization_frameworks" ADD CONSTRAINT "organization_frameworks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_frameworks" ADD CONSTRAINT "organization_frameworks_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: each organization starts with the frameworks its existing
-- assessments already cover, so nothing changes until someone edits them.
INSERT INTO "organization_frameworks" ("id", "organizationId", "frameworkId")
SELECT DISTINCT ON (a."organizationId", af."frameworkId")
       'ofw_' || md5(a."organizationId" || af."frameworkId"), a."organizationId", af."frameworkId"
FROM "assessment_frameworks" af
JOIN "assessments" a ON a."id" = af."assessmentId";
