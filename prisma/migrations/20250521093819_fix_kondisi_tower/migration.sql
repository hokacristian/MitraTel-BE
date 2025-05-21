/*
  Warnings:

  - You are about to drop the column `jmlhKaratBerat` on the `KondisiTower` table. All the data in the column will be lost.
  - You are about to drop the column `jmlhKaratRingan` on the `KondisiTower` table. All the data in the column will be lost.
  - You are about to drop the column `jmlhKaratSedang` on the `KondisiTower` table. All the data in the column will be lost.
  - You are about to drop the column `kelengkapanBaut` on the `KondisiTower` table. All the data in the column will be lost.
  - You are about to drop the column `lvlKarat` on the `KondisiTower` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "KondisiTower" DROP COLUMN "jmlhKaratBerat",
DROP COLUMN "jmlhKaratRingan",
DROP COLUMN "jmlhKaratSedang",
DROP COLUMN "kelengkapanBaut",
DROP COLUMN "lvlKarat",
ADD COLUMN     "deskripsiKarat" TEXT,
ADD COLUMN     "levelKarat" TEXT,
ADD COLUMN     "lvlBaut" TEXT,
ADD COLUMN     "poseTower" TEXT;
