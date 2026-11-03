-- AlterTable: category SEO content and image
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "longDescription" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
