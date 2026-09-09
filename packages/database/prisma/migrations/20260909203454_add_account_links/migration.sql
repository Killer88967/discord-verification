-- CreateEnum
CREATE TYPE "AccountLinkReason" AS ENUM ('DEVICE_TOKEN');

-- CreateEnum
CREATE TYPE "AccountLinkConfidence" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "AccountLink" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "reason" "AccountLinkReason" NOT NULL,
    "confidence" "AccountLinkConfidence" NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountLink_userAId_idx" ON "AccountLink"("userAId");

-- CreateIndex
CREATE INDEX "AccountLink_userBId_idx" ON "AccountLink"("userBId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountLink_userAId_userBId_reason_key" ON "AccountLink"("userAId", "userBId", "reason");
