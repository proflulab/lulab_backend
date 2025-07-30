-- AlterEnum
ALTER TYPE "LoginLogType" ADD VALUE 'PASSWORD_RESET';

-- AlterTable
ALTER TABLE "meeting_files" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "meeting_records" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "language" VARCHAR(10),
ADD COLUMN     "timezone" VARCHAR(50);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "uuid" TEXT,
    "userName" TEXT,
    "phoneHash" TEXT,
    "joinTime" TIMESTAMP(3),
    "leftTime" TIMESTAMP(3),
    "instanceId" INTEGER,
    "userRole" INTEGER,
    "msOpenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingTranscript" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "paragraphId" TEXT NOT NULL,
    "speakerId" TEXT,
    "speakerName" TEXT,
    "startTime" INTEGER NOT NULL,
    "endTime" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetingId_idx" ON "MeetingParticipant"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingParticipant_phoneHash_idx" ON "MeetingParticipant"("phoneHash");

-- CreateIndex
CREATE INDEX "MeetingTranscript_meetingId_idx" ON "MeetingTranscript"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingTranscript_speakerId_idx" ON "MeetingTranscript"("speakerId");

-- CreateIndex
CREATE INDEX "meeting_records_deletedAt_idx" ON "meeting_records"("deletedAt");

-- CreateIndex
CREATE INDEX "meeting_records_createdAt_idx" ON "meeting_records"("createdAt");

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTranscript" ADD CONSTRAINT "MeetingTranscript_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingTranscript" ADD CONSTRAINT "MeetingTranscript_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
