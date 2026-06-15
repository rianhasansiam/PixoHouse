-- CreateTable
CREATE TABLE "AdminCapital" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminCapital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminOtherCost" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "costDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminOtherCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminOtherCost_costDate_idx" ON "AdminOtherCost"("costDate");

-- CreateIndex
CREATE INDEX "AdminOtherCost_reason_idx" ON "AdminOtherCost"("reason");
