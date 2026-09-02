-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationEventType" AS ENUM ('SESSION_CREATED', 'SESSION_OPENED', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildConfig" (
    "guildId" TEXT NOT NULL,
    "verifiedRoleId" TEXT,
    "verificationChannelId" TEXT,
    "logChannelId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildConfig_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "VerificationSession" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerifiedUser" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerifiedUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvent" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "VerificationEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationSession_tokenHash_key" ON "VerificationSession"("tokenHash");

-- CreateIndex
CREATE INDEX "VerificationSession_guildId_userId_idx" ON "VerificationSession"("guildId", "userId");

-- CreateIndex
CREATE INDEX "VerificationSession_status_idx" ON "VerificationSession"("status");

-- CreateIndex
CREATE INDEX "VerificationSession_expiresAt_idx" ON "VerificationSession"("expiresAt");

-- CreateIndex
CREATE INDEX "VerifiedUser_userId_idx" ON "VerifiedUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerifiedUser_guildId_userId_key" ON "VerifiedUser"("guildId", "userId");

-- CreateIndex
CREATE INDEX "VerificationEvent_guildId_userId_idx" ON "VerificationEvent"("guildId", "userId");

-- CreateIndex
CREATE INDEX "VerificationEvent_sessionId_idx" ON "VerificationEvent"("sessionId");

-- CreateIndex
CREATE INDEX "VerificationEvent_createdAt_idx" ON "VerificationEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "GuildConfig" ADD CONSTRAINT "GuildConfig_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSession" ADD CONSTRAINT "VerificationSession_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerifiedUser" ADD CONSTRAINT "VerifiedUser_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvent" ADD CONSTRAINT "VerificationEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VerificationSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
