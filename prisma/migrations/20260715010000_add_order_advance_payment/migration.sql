-- Records money collected when an admin places an order. This is kept
-- separate from the order total so sales revenue and product profit are not
-- reduced by a payment collection.
ALTER TABLE "Order"
  ADD COLUMN "advancePayment" DECIMAL(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_advancePayment_nonnegative_check"
  CHECK ("advancePayment" >= 0);
