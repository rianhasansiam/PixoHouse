-- AlterEnum
ALTER TYPE "CapitalCostActivityType" ADD VALUE 'CAPITAL_ADDED';

-- AlterTable
ALTER TABLE "AdminCapitalCostActivity" ADD COLUMN     "actorEmail" TEXT,
ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "actorName" TEXT;
