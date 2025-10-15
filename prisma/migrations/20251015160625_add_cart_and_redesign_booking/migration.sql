/*
  Warnings:

  - You are about to drop the column `bookingId` on the `booking_kimonos` table. All the data in the column will be lost.
  - You are about to drop the column `addOns` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `campaignPlanId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `pickupTime` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `planId` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `rentalDate` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `returnDate` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `returnTime` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `storeId` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `bookingItemId` to the `booking_kimonos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitDate` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visitTime` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."booking_kimonos" DROP CONSTRAINT "booking_kimonos_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_planId_fkey";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_storeId_fkey";

-- DropIndex
DROP INDEX "public"."bookings_rentalDate_idx";

-- DropIndex
DROP INDEX "public"."bookings_storeId_idx";

-- AlterTable
ALTER TABLE "booking_kimonos" DROP COLUMN "bookingId",
ADD COLUMN     "bookingItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "addOns",
DROP COLUMN "campaignPlanId",
DROP COLUMN "notes",
DROP COLUMN "pickupTime",
DROP COLUMN "planId",
DROP COLUMN "rentalDate",
DROP COLUMN "returnDate",
DROP COLUMN "returnTime",
DROP COLUMN "storeId",
ADD COLUMN     "specialRequests" TEXT,
ADD COLUMN     "visitDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "visitTime" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "planId" TEXT,
    "campaignPlanId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "addOns" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "planId" TEXT,
    "campaignPlanId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "addOns" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carts_userId_key" ON "carts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "carts_sessionId_key" ON "carts"("sessionId");

-- CreateIndex
CREATE INDEX "carts_userId_idx" ON "carts"("userId");

-- CreateIndex
CREATE INDEX "carts_sessionId_idx" ON "carts"("sessionId");

-- CreateIndex
CREATE INDEX "carts_expiresAt_idx" ON "carts"("expiresAt");

-- CreateIndex
CREATE INDEX "booking_items_storeId_idx" ON "booking_items"("storeId");

-- CreateIndex
CREATE INDEX "bookings_visitDate_idx" ON "bookings"("visitDate");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "rental_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "rental_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_kimonos" ADD CONSTRAINT "booking_kimonos_bookingItemId_fkey" FOREIGN KEY ("bookingItemId") REFERENCES "booking_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
