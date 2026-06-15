-- CreateEnum
CREATE TYPE "CapitalCostActivityType" AS ENUM ('CAPITAL_SET', 'CAPITAL_UPDATED', 'COST_CREATED', 'COST_UPDATED', 'COST_DELETED');

-- CreateTable
CREATE TABLE "AdminCapitalCostActivity" (
    "id" TEXT NOT NULL,
    "type" "CapitalCostActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "note" TEXT,
    "entityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCapitalCostActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminCapitalCostActivity_createdAt_idx" ON "AdminCapitalCostActivity"("createdAt");
