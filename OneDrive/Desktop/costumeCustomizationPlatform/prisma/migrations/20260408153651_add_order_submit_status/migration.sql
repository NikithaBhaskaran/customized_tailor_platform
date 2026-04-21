-- AlterEnum
ALTER TYPE "OrderStatusType" ADD VALUE 'PENDING_TAILOR_REVIEW';

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_tailorId_fkey";

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "tailorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_tailorId_fkey" FOREIGN KEY ("tailorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
