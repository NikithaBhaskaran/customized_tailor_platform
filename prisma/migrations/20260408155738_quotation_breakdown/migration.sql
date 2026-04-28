/*
  Warnings:

  - Added the required column `deliveryCost` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `embroideryCost` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedDeliveryDays` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fabricCost` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stitchingCost` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "OrderStatusType" ADD VALUE 'QUOTATION_SENT';

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "deliveryCost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "embroideryCost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "estimatedDeliveryDays" INTEGER NOT NULL,
ADD COLUMN     "fabricCost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "stitchingCost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "totalPrice" DECIMAL(10,2) NOT NULL;
