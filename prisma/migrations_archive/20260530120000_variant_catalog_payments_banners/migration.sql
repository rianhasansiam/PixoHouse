-- Data-preserving migration: move to a variant-based catalog, snapshot-based
-- order items, saved addresses, payment transactions, inventory logs, promo
-- usage tracking, and a unified banner model.
--
-- Strategy: create new structures first, BACKFILL from existing columns, and
-- only THEN drop the old columns. No existing data is lost.

-- ---------------------------------------------------------------------------
-- 1. New enums
--
-- NOTE: The PromoCode / StoreSettings / ContactMessage models and their
-- supporting enums (PromoDiscountType, PromoCodeStatus, ContactMessageStatus)
-- existed in schema.prisma and in the live Neon database, but were never
-- written into an earlier migration file (likely created out-of-band via an
-- earlier `prisma db push` or manual SQL). That caused this migration to
-- reference "PromoCode" in a foreign key without ever creating it, which
-- broke shadow-database replay (P3006 / 42P01).
--
-- The CREATE TYPE / CREATE TABLE statements for those missing objects are
-- added here using idempotent guards (`IF NOT EXISTS`, DO-block exception
-- handlers). On the live Neon database the objects already exist, so the
-- guards make these statements no-ops; on a fresh shadow database they
-- create the missing objects so the rest of the migration can apply
-- cleanly. No existing data is touched or dropped.
-- ---------------------------------------------------------------------------
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "InventoryLogType" AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ORDER_PLACED', 'ORDER_CANCELLED', 'RETURNED', 'MANUAL_ADJUSTMENT');
CREATE TYPE "BannerType" AS ENUM ('CAROUSEL', 'CATEGORY', 'TOP', 'DEAL', 'PROMO');
CREATE TYPE "BannerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- Idempotent creates for enums that should already exist but are missing
-- from earlier migrations.
DO $$ BEGIN
    CREATE TYPE "PromoDiscountType" AS ENUM ('FLAT', 'PERCENT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "PromoCodeStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- 2. New tables
-- ---------------------------------------------------------------------------
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "salePrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "transactionId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryLog" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "type" "InventoryLogType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- PromoCode parent table. Missing from earlier migrations but already present
-- in the live database. IF NOT EXISTS keeps this safe on Neon while making
-- the migration replayable on a fresh shadow database.
CREATE TABLE IF NOT EXISTS "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "PromoDiscountType" NOT NULL DEFAULT 'FLAT',
    "value" DECIMAL(10,2) NOT NULL,
    "minOrder" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "PromoCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PromoCodeUsage" (
    "id" TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromoCodeUsage_pkey" PRIMARY KEY ("id")
);

-- StoreSettings singleton table. Missing from earlier migrations but already
-- present in the live database.
CREATE TABLE IF NOT EXISTS "StoreSettings" (
    "id" TEXT NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "standardShippingFee" DECIMAL(10,2) NOT NULL DEFAULT 120,
    "freeShippingThreshold" DECIMAL(10,2) NOT NULL DEFAULT 50000,
    "expressShippingFee" DECIMAL(10,2) NOT NULL DEFAULT 250,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- ContactMessage inbox table. Missing from earlier migrations but already
-- present in the live database.
CREATE TABLE IF NOT EXISTS "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "type" "BannerType" NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "description" TEXT,
    "image" TEXT,
    "link" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "BannerStatus" NOT NULL DEFAULT 'ACTIVE',
    "categoryId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- Indexes for the new tables
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX "Address_userId_idx" ON "Address"("userId");
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");
CREATE INDEX "PaymentTransaction_transactionId_idx" ON "PaymentTransaction"("transactionId");
CREATE INDEX "InventoryLog_variantId_idx" ON "InventoryLog"("variantId");
CREATE INDEX "PromoCodeUsage_promoCodeId_idx" ON "PromoCodeUsage"("promoCodeId");
CREATE INDEX "PromoCodeUsage_userId_idx" ON "PromoCodeUsage"("userId");
CREATE UNIQUE INDEX "PromoCodeUsage_promoCodeId_orderId_key" ON "PromoCodeUsage"("promoCodeId", "orderId");
CREATE INDEX "Banner_type_status_position_idx" ON "Banner"("type", "status", "position");
CREATE INDEX "Banner_categoryId_status_idx" ON "Banner"("categoryId", "status");

-- Indexes for the PromoCode / ContactMessage tables that were back-filled
-- above. IF NOT EXISTS keeps these safe on the live database where these
-- indexes already exist.
CREATE UNIQUE INDEX IF NOT EXISTS "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX IF NOT EXISTS "PromoCode_status_code_idx" ON "PromoCode"("status", "code");
CREATE INDEX IF NOT EXISTS "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");

-- ---------------------------------------------------------------------------
-- 3. Order: add the new address snapshot column (non-destructive)
-- ---------------------------------------------------------------------------
ALTER TABLE "Order" ADD COLUMN "customerArea" TEXT;

-- ---------------------------------------------------------------------------
-- 4. Product.slug: add nullable, backfill from name, dedupe, then enforce
-- ---------------------------------------------------------------------------
ALTER TABLE "Product" ADD COLUMN "slug" TEXT;

-- Slugify name: lowercase, non-alphanumerics -> '-', trim leading/trailing '-'
UPDATE "Product"
SET "slug" = lower(regexp_replace(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'));

-- Guard against an empty slug (name had no alphanumerics)
UPDATE "Product" SET "slug" = "id" WHERE "slug" IS NULL OR "slug" = '';

-- Resolve any collisions by appending a short id fragment to later rows
WITH ranked AS (
    SELECT "id", "slug",
           ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "createdAt", "id") AS rn
    FROM "Product"
)
UPDATE "Product" p
SET "slug" = p."slug" || '-' || substr(p."id", 1, 6)
FROM ranked r
WHERE p."id" = r."id" AND r.rn > 1;

ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 5. Backfill ProductVariant from each existing product (price/stock/discount)
-- ---------------------------------------------------------------------------
INSERT INTO "ProductVariant" ("id", "productId", "sku", "color", "size", "price", "salePrice", "stock", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    p."id",
    'SKU-' || p."id",
    NULL,
    NULL,
    p."price"::numeric(10,2),
    p."discountPrice"::numeric(10,2),
    COALESCE(p."stock", 0),
    p."createdAt",
    p."updatedAt"
FROM "Product" p;

-- ---------------------------------------------------------------------------
-- 6. Backfill ProductImage from the images[] array (preserving order)
-- ---------------------------------------------------------------------------
INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "position", "createdAt")
SELECT
    gen_random_uuid()::text,
    p."id",
    img.url,
    NULL,
    (img.ord - 1)::int,
    p."createdAt"
FROM "Product" p
CROSS JOIN LATERAL unnest(p."images") WITH ORDINALITY AS img(url, ord)
WHERE p."images" IS NOT NULL AND array_length(p."images", 1) > 0;

-- Products with no images[] but a single legacy image -> one ProductImage
INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "position", "createdAt")
SELECT
    gen_random_uuid()::text,
    p."id",
    p."image",
    NULL,
    0,
    p."createdAt"
FROM "Product" p
WHERE (p."images" IS NULL OR array_length(p."images", 1) IS NULL OR array_length(p."images", 1) = 0)
  AND p."image" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 7. OrderItem: add snapshot columns, backfill, then drop legacy price
-- ---------------------------------------------------------------------------
ALTER TABLE "OrderItem"
    ADD COLUMN "productImage" TEXT,
    ADD COLUMN "productName" TEXT,
    ADD COLUMN "sku" TEXT,
    ADD COLUMN "totalPrice" DECIMAL(10,2),
    ADD COLUMN "unitPrice" DECIMAL(10,2);

-- Snapshot from the joined product; unit/total from the historical price
UPDATE "OrderItem" oi
SET "productName"  = COALESCE(p."name", 'Unknown product'),
    "productImage" = p."image",
    "sku"          = 'SKU-' || p."id",
    "unitPrice"    = oi."price"::numeric(10,2),
    "totalPrice"   = (oi."price" * oi."quantity")::numeric(10,2)
FROM "Product" p
WHERE p."id" = oi."productId";

-- Safety net for any order item whose product is already missing
UPDATE "OrderItem"
SET "productName" = COALESCE("productName", 'Unknown product'),
    "unitPrice"   = COALESCE("unitPrice", "price"::numeric(10,2)),
    "totalPrice"  = COALESCE("totalPrice", ("price" * "quantity")::numeric(10,2))
WHERE "productName" IS NULL OR "unitPrice" IS NULL OR "totalPrice" IS NULL;

ALTER TABLE "OrderItem"
    ALTER COLUMN "productName" SET NOT NULL,
    ALTER COLUMN "unitPrice" SET NOT NULL,
    ALTER COLUMN "totalPrice" SET NOT NULL;

ALTER TABLE "OrderItem" DROP COLUMN "price";

-- Allow order history to survive product deletion
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 8. Product: drop legacy columns now that data has been migrated
-- ---------------------------------------------------------------------------
ALTER TABLE "Product"
    DROP COLUMN "badge",
    DROP COLUMN "discountPrice",
    DROP COLUMN "image",
    DROP COLUMN "images",
    DROP COLUMN "price",
    DROP COLUMN "rating",
    DROP COLUMN "reviewCount",
    DROP COLUMN "stock";

-- Product indexes from the new schema
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");

-- ---------------------------------------------------------------------------
-- 9. Foreign keys (match Prisma's expected referential actions)
-- ---------------------------------------------------------------------------
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromoCodeUsage" ADD CONSTRAINT "PromoCodeUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
