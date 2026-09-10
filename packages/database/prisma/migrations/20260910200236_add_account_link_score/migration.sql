/*
  Warnings:

  - Added the required column `score` to the `AccountLink` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AccountLink" ADD COLUMN     "score" INTEGER NOT NULL;
