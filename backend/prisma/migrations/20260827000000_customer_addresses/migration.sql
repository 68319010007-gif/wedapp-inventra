-- AlterTable
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ResidenceType" AS ENUM ('HOUSE', 'CONDO', 'TOWNHOUSE', 'APARTMENT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "VehicleAccess" AS ENUM ('TRUCK_4_AND_6', 'TRUCK_4_ONLY', 'TRUCK_6_ONLY', 'NONE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneAlt" TEXT,
    "houseNo" TEXT NOT NULL,
    "moo" TEXT,
    "village" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "soi" TEXT,
    "road" TEXT,
    "postalCode" TEXT NOT NULL,
    "subdistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "residenceType" "ResidenceType",
    "residenceOther" TEXT,
    "hasElevator" BOOLEAN,
    "vehicleAccess" "VehicleAccess",
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "mapAddress" TEXT,
    "isDefaultShipping" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultTax" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

DO $$ BEGIN
  ALTER TABLE "CustomerAddress"
    ADD CONSTRAINT "CustomerAddress_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
