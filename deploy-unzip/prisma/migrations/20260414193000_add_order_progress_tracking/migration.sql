CREATE TYPE "OrderProgressStatus" AS ENUM (
    'PENDING_APPROVAL',
    'AWAITING_PAYMENT',
    'CONFIRMED',
    'CUTTING',
    'STITCHING',
    'FINISHING',
    'READY',
    'DELIVERED'
);

ALTER TABLE "Order"
ADD COLUMN "progressStatus" "OrderProgressStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';

CREATE TABLE "OrderProgressUpdate" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderProgressStatus" NOT NULL,
    "note" TEXT,
    "changedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderProgressUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderProgressUpdate_orderId_createdAt_idx" ON "OrderProgressUpdate"("orderId", "createdAt");

ALTER TABLE "OrderProgressUpdate"
ADD CONSTRAINT "OrderProgressUpdate_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderProgressUpdate"
ADD CONSTRAINT "OrderProgressUpdate_changedByUserId_fkey"
FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "OrderProgressUpdate" ("id", "orderId", "status", "note", "changedByUserId", "createdAt")
SELECT
  'init_' || "id",
  "id",
  "progressStatus",
  'Progress tracking initialized.',
  NULL,
  CURRENT_TIMESTAMP
FROM "Order";
