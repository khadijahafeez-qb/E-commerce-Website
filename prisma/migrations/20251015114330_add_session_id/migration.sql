/*
  Warnings:

  - You are about to drop the column `stripePaymentIntentId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSessionId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Order_stripePaymentIntentId_key";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "stripeSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_stripeSessionId_key" ON "public"."Order"("stripeSessionId");
