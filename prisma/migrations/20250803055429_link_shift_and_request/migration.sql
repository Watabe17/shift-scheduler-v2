/*
  Warnings:

  - A unique constraint covering the columns `[shiftId]` on the table `shift_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."shift_requests" ADD COLUMN     "shiftId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "shift_requests_shiftId_key" ON "public"."shift_requests"("shiftId");

-- AddForeignKey
ALTER TABLE "public"."shift_requests" ADD CONSTRAINT "shift_requests_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
