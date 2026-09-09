/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,kind]` on the table `VerificationSignal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VerificationSignal_sessionId_kind_key" ON "VerificationSignal"("sessionId", "kind");
