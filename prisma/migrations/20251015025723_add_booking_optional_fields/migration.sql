-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_planId_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "campaignPlanId" TEXT,
ADD COLUMN     "pickupTime" TEXT,
ADD COLUMN     "returnTime" TEXT,
ALTER COLUMN "planId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_planId_fkey" FOREIGN KEY ("planId") REFERENCES "rental_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
