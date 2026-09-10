/*
  Warnings:

  - A unique constraint covering the columns `[userAId,userBId]` on the table `AccountLink` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AccountLink_userAId_userBId_reason_key";

-- CreateIndex
CREATE UNIQUE INDEX "AccountLink_userAId_userBId_key" ON "AccountLink"("userAId", "userBId");
