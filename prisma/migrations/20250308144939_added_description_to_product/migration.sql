ALTER TABLE "Product"
ADD COLUMN "description" TEXT;

UPDATE "Product"
SET "description" = "name";

ALTER TABLE "Product"
ALTER COLUMN "description" SET NOT NULL;