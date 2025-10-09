-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "isDeleted" TEXT NOT NULL DEFAULT 'active';
