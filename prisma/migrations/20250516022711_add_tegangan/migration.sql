-- CreateEnum
CREATE TYPE "TeganganKategori" AS ENUM ('RN', 'TN', 'SN', 'RT', 'ST', 'RS', 'GN', 'N', 'R', 'S', 'T');

-- CreateEnum
CREATE TYPE "TeganganStatus" AS ENUM ('VALID', 'INVALID');

-- CreateTable
CREATE TABLE "TeganganListrik" (
    "id" SERIAL NOT NULL,
    "towerId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "kategori" "TeganganKategori" NOT NULL,
    "nilaiInput" DOUBLE PRECISION NOT NULL,
    "nilaiDeteksi" DOUBLE PRECISION NOT NULL,
    "status" "TeganganStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeganganListrik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeganganFoto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "teganganId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeganganFoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TeganganListrik" ADD CONSTRAINT "TeganganListrik_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeganganListrik" ADD CONSTRAINT "TeganganListrik_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeganganFoto" ADD CONSTRAINT "TeganganFoto_teganganId_fkey" FOREIGN KEY ("teganganId") REFERENCES "TeganganListrik"("id") ON DELETE CASCADE ON UPDATE CASCADE;
