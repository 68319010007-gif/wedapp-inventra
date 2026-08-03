-- AlterTable Customer: add auth & avatar fields
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");

-- CreateTable ProductImage
CREATE TABLE IF NOT EXISTS "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductImage" DROP CONSTRAINT IF EXISTS "ProductImage_productId_fkey";
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
