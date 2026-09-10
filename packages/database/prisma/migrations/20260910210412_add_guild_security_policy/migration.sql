-- CreateEnum
CREATE TYPE "VerificationRiskAction" AS ENUM ('NONE', 'REJECT', 'KICK', 'BAN');

-- AlterTable
ALTER TABLE "GuildConfig" ADD COLUMN     "minimumAccountAgeDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "riskAction" "VerificationRiskAction" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "riskThreshold" INTEGER NOT NULL DEFAULT 70;
