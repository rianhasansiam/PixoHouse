-- Add a human-readable, system-generated product code (e.g. "PRD-00001").
-- Strategy: add nullable -> backfill existing rows sequentially -> enforce
-- NOT NULL + unique. This keeps the column safe to deploy against a table
-- that already has data.

-- 1) Add the column as nullable so existing rows are valid for now.
ALTER TABLE "Product" ADD COLUMN "productCode" TEXT;

-- 2) Backfill: number existing products by creation order (oldest first)
--    and format as PRD-00001, PRD-00002, ... using a 5-wide zero pad.
WITH numbered AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS seq
  FROM "Product"
)
UPDATE "Product" AS p
SET "productCode" = 'PRD-' || LPAD(numbered.seq::text, 5, '0')
FROM numbered
WHERE p."id" = numbered."id";

-- 3) Enforce NOT NULL now that every row has a value.
ALTER TABLE "Product" ALTER COLUMN "productCode" SET NOT NULL;

-- 4) Unique index so codes never collide.
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");
