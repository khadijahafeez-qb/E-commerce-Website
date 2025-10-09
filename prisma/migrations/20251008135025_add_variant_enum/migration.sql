/*
  Warnings:

  - You are about to drop the column `img` on the `Product` table. All the data in the column will be lost.
  - Made the column `variantId` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `img` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."VariantAvailability" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";

-- AlterTable
ALTER TABLE "public"."OrderItem" ALTER COLUMN "variantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "img";

-- AlterTable
ALTER TABLE "public"."ProductVariant" ADD COLUMN     "availabilityStatus" "public"."VariantAvailability" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "img" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
