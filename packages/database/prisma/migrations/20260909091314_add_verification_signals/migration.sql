-- CreateEnum
CREATE TYPE "VerificationSignalKind" AS ENUM ('DEVICE_TOKEN', 'USER_AGENT', 'TIMEZONE', 'LANGUAGE', 'PLATFORM', 'SCREEN', 'HARDWARE', 'NETWORK');

-- CreateTable
CREATE TABLE "BrowserDevice" (
    "id" TEXT NOT NULL,
    "deviceTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrowserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationSignal" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "kind" "VerificationSignalKind" NOT NULL,
    "valueHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrowserDevice_deviceTokenHash_key" ON "BrowserDevice"("deviceTokenHash");

-- CreateIndex
CREATE INDEX "VerificationSignal_kind_valueHash_idx" ON "VerificationSignal"("kind", "valueHash");

-- CreateIndex
CREATE INDEX "VerificationSignal_sessionId_idx" ON "VerificationSignal"("sessionId");

-- AddForeignKey
ALTER TABLE "VerificationSignal" ADD CONSTRAINT "VerificationSignal_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VerificationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
