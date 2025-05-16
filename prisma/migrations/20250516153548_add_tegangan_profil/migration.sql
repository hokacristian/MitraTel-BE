/*
  Warnings:

  - Added the required column `profil` to the `TeganganListrik` table without a default value. This is not possible if the table is not empty.
  - Added the required column `satuan` to the `TeganganListrik` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TeganganProfil" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- AlterTable
ALTER TABLE "TeganganListrik" ADD COLUMN     "profil" "TeganganProfil" NOT NULL,
ADD COLUMN     "satuan" TEXT NOT NULL;
