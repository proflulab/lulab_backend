/*
  Warnings:

  - The `transcript` column on the `meeting_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "meeting_records" ADD COLUMN     "subMeetingId" TEXT,
DROP COLUMN "transcript",
ADD COLUMN     "transcript" JSONB;

-- AddForeignKey
ALTER TABLE "meeting_records" ADD CONSTRAINT "meeting_records_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
