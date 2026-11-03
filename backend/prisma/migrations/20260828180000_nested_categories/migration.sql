-- AlterTable: nested categories
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Category_parentId_idx" ON "Category"("parentId");

DO $$ BEGIN
  ALTER TABLE "Category"
    ADD CONSTRAINT "Category_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
