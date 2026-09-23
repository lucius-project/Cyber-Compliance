-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "control_assessments" ADD COLUMN     "meetingId" TEXT;

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meetings_assessmentId_idx" ON "meetings"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_assessmentId_sequenceNumber_key" ON "meetings"("assessmentId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "control_assessments_meetingId_idx" ON "control_assessments"("meetingId");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_assessments" ADD CONSTRAINT "control_assessments_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
