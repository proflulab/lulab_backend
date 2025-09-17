-- DropForeignKey
ALTER TABLE "MeetingParticipation" DROP CONSTRAINT "MeetingParticipation_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipation" DROP CONSTRAINT "MeetingParticipation_platformUserId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingParticipation" DROP CONSTRAINT "MeetingParticipation_userId_fkey";

-- DropForeignKey
ALTER TABLE "MeetingTranscript" DROP CONSTRAINT "MeetingTranscript_userId_fkey";

-- DropForeignKey
ALTER TABLE "meeting_records" DROP CONSTRAINT "meeting_records_hostUserId_fkey";

-- DropForeignKey
ALTER TABLE "meeting_records" DROP CONSTRAINT "meeting_records_userId_fkey";

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "deviceId" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_jti_idx" ON "RefreshToken"("jti");

-- CreateIndex
CREATE INDEX "RefreshToken_deviceId_userId_idx" ON "RefreshToken"("deviceId", "userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshToken_revokedAt_idx" ON "RefreshToken"("revokedAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_revokedAt_idx" ON "RefreshToken"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "MeetingTranscript_endTime_idx" ON "MeetingTranscript"("endTime");

-- CreateIndex
CREATE INDEX "MeetingTranscript_platformUserId_idx" ON "MeetingTranscript"("platformUserId");

-- CreateIndex
CREATE INDEX "MeetingTranscript_userId_idx" ON "MeetingTranscript"("userId");

-- CreateIndex
CREATE INDEX "PlatformUser_userName_idx" ON "PlatformUser"("userName");

-- CreateIndex
CREATE INDEX "PlatformUser_isActive_idx" ON "PlatformUser"("isActive");

-- CreateIndex
CREATE INDEX "PlatformUser_lastSeenAt_idx" ON "PlatformUser"("lastSeenAt");

-- CreateIndex
CREATE INDEX "meeting_files_fileName_idx" ON "meeting_files"("fileName");

-- CreateIndex
CREATE INDEX "meeting_records_endTime_idx" ON "meeting_records"("endTime");

-- CreateIndex
CREATE INDEX "meeting_records_hostUserId_idx" ON "meeting_records"("hostUserId");

-- CreateIndex
CREATE INDEX "meeting_records_userId_idx" ON "meeting_records"("userId");

-- CreateIndex
CREATE INDEX "meeting_summaries_language_idx" ON "meeting_summaries"("language");

-- CreateIndex
CREATE INDEX "meeting_summaries_reviewedBy_idx" ON "meeting_summaries"("reviewedBy");

-- AddForeignKey
ALTER TABLE "MeetingParticipation" ADD CONSTRAINT "MeetingParticipation_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meeting_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipation" ADD CONSTRAINT "MeetingParticipation_platformUserId_fkey" FOREIGN KEY ("platformUserId") REFERENCES "PlatformUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipation" ADD CONSTRAINT "MeetingParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
