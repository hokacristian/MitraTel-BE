/*
  Warnings:

  - You are about to drop the column `jumlahAntenaRWU` on the `PerangkatAntenna` table. All the data in the column will be lost.
  - Added the required column `jumlahAntenaMW` to the `PerangkatAntenna` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PerangkatAntenna" DROP COLUMN "jumlahAntenaRWU",
ADD COLUMN     "jumlahAntenaMW" INTEGER NOT NULL;
