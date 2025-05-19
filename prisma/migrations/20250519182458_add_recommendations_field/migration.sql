-- AlterTable
ALTER TABLE "KebersihanSite" ADD COLUMN     "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[];
