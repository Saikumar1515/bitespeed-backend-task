/*
  Warnings:

  - The values [primary,secondary] on the enum `LinkPrecedence` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."LinkPrecedence_new" AS ENUM ('PRIMARY', 'SECONDARY');
ALTER TABLE "public"."Contact" ALTER COLUMN "linkPrecedence" DROP DEFAULT;
ALTER TABLE "public"."Contact" ALTER COLUMN "linkPrecedence" TYPE "public"."LinkPrecedence_new" USING ("linkPrecedence"::text::"public"."LinkPrecedence_new");
ALTER TYPE "public"."LinkPrecedence" RENAME TO "LinkPrecedence_old";
ALTER TYPE "public"."LinkPrecedence_new" RENAME TO "LinkPrecedence";
DROP TYPE "public"."LinkPrecedence_old";
ALTER TABLE "public"."Contact" ALTER COLUMN "linkPrecedence" SET DEFAULT 'PRIMARY';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Contact" ALTER COLUMN "linkPrecedence" SET DEFAULT 'PRIMARY';

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_linkedId_fkey" FOREIGN KEY ("linkedId") REFERENCES "public"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
