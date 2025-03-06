ALTER TABLE "Product"
ADD COLUMN "isInStock" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product"
SET "isInStock" = "quantity" <> 0;

ALTER TABLE "Product"
DROP COLUMN "quantity";