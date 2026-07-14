-- Product inventory is included in the Capital & Cost tracker only after an
-- admin explicitly selects it. One row per product prevents duplicate cards.
CREATE TABLE "AdminProductCost" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProductCost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminProductCost_productId_key" ON "AdminProductCost"("productId");
CREATE INDEX "AdminProductCost_createdAt_idx" ON "AdminProductCost"("createdAt");

ALTER TABLE "AdminProductCost"
  ADD CONSTRAINT "AdminProductCost_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "CapitalCostActivityType" ADD VALUE 'PRODUCT_COST_ADDED';
ALTER TYPE "CapitalCostActivityType" ADD VALUE 'PRODUCT_COST_REMOVED';
