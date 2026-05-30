-- Convert money-related Float (double precision) columns to DECIMAL for exact
-- currency precision. PostgreSQL casts double precision -> numeric in place,
-- so existing values are preserved (no data loss). Rating/score fields are
-- intentionally left as Float.

-- `Order.subtotal` was added to the live database out-of-band (an earlier
-- `prisma db push`) and was never written into a migration, so it is missing
-- on a fresh shadow-database replay. Add it idempotently before the type
-- conversion below:
--   - on the live Neon DB the column already exists, so IF NOT EXISTS makes
--     this a no-op;
--   - on a fresh replay the Order table is empty, so a NOT NULL column
--     without a default applies cleanly and then gets converted to DECIMAL.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "deliveryCharge" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "taxAmount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "PromoCode" ALTER COLUMN "value" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "minOrder" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "maxDiscount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "StoreSettings" ALTER COLUMN "taxRate" SET DATA TYPE DECIMAL(5,4),
ALTER COLUMN "standardShippingFee" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "freeShippingThreshold" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "expressShippingFee" SET DATA TYPE DECIMAL(10,2);
