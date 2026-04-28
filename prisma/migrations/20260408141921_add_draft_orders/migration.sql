-- CreateEnum
CREATE TYPE "DraftOrderStatus" AS ENUM ('DRAFT');

-- CreateTable
CREATE TABLE "DraftOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fabric" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "sleeveStyle" TEXT NOT NULL,
    "neckStyle" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "embroidery" TEXT NOT NULL,
    "notes" TEXT,
    "status" "DraftOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DraftOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DraftOrder_userId_createdAt_idx" ON "DraftOrder"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "DraftOrder" ADD CONSTRAINT "DraftOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
