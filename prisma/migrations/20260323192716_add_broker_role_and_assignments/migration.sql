/*
  Warnings:

  - A unique constraint covering the columns `[linkedBrokerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BROKER';

-- AlterTable
ALTER TABLE "Broker" ADD COLUMN     "managedByAdminId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "linkedBrokerId" INTEGER;

-- CreateIndex
CREATE INDEX "Broker_managedByAdminId_idx" ON "Broker"("managedByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "User_linkedBrokerId_key" ON "User"("linkedBrokerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_linkedBrokerId_fkey" FOREIGN KEY ("linkedBrokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_managedByAdminId_fkey" FOREIGN KEY ("managedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
