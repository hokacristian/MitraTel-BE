/*
  Warnings:

  - The `status` column on the `TeganganListrik` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ERROR');

-- AlterTable
ALTER TABLE "KebersihanSite" ADD COLUMN     "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "classification" DROP NOT NULL,
ALTER COLUMN "tanamanLiar" SET DEFAULT 0,
ALTER COLUMN "lumut" SET DEFAULT 0,
ALTER COLUMN "genanganAir" SET DEFAULT 0,
ALTER COLUMN "nodaDinding" SET DEFAULT 0,
ALTER COLUMN "retakan" SET DEFAULT 0,
ALTER COLUMN "sampah" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "PerangkatAntenna" ADD COLUMN     "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "jumlahAntenaRF" SET DEFAULT 0,
ALTER COLUMN "jumlahAntenaRRU" SET DEFAULT 0,
ALTER COLUMN "totalAntena" SET DEFAULT 0,
ALTER COLUMN "jumlahAntenaMW" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "TeganganListrik" ADD COLUMN     "validationStatus" "TeganganStatus",
ALTER COLUMN "nilaiDeteksi" SET DEFAULT 0,
DROP COLUMN "status",
ADD COLUMN     "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "profil" DROP NOT NULL,
ALTER COLUMN "satuan" SET DEFAULT 'V';
