-- Admins can record walk-in / guest orders without creating a login account.
-- Customer checkout remains account-bound in the application layer.
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
