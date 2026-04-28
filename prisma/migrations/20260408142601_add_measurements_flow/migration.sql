-- AlterEnum
ALTER TYPE "OrderStatusType" ADD VALUE 'MEASUREMENTS_ADDED';

-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN     "height" DECIMAL(8,2),
ADD COLUMN     "referenceImage" TEXT;
