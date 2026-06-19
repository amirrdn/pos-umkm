/*
  Warnings:

  - You are about to drop the column `outletId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_outletId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "outletId",
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "user_outlets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,

    CONSTRAINT "user_outlets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_outlets_userId_outletId_key" ON "user_outlets"("userId", "outletId");

-- AddForeignKey
ALTER TABLE "user_outlets" ADD CONSTRAINT "user_outlets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_outlets" ADD CONSTRAINT "user_outlets_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
