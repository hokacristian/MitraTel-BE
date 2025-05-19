-- CreateTable
CREATE TABLE "Wilayah" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wilayah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tower" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "wilayahId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KebersihanSite" (
    "id" SERIAL NOT NULL,
    "towerId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "tanamanLiar" INTEGER NOT NULL,
    "lumut" INTEGER NOT NULL,
    "genanganAir" INTEGER NOT NULL,
    "nodaDinding" INTEGER NOT NULL,
    "retakan" INTEGER NOT NULL,
    "sampah" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KebersihanSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KebersihanFoto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "kebersihanId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KebersihanFoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerangkatAntenna" (
    "id" SERIAL NOT NULL,
    "towerId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "jumlahAntenaRF" INTEGER NOT NULL,
    "jumlahAntenaRRU" INTEGER NOT NULL,
    "jumlahAntenaRWU" INTEGER NOT NULL,
    "totalAntena" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerangkatAntenna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerangkatFoto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "perangkatId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerangkatFoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Tower" ADD CONSTRAINT "Tower_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "Wilayah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KebersihanSite" ADD CONSTRAINT "KebersihanSite_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KebersihanSite" ADD CONSTRAINT "KebersihanSite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KebersihanFoto" ADD CONSTRAINT "KebersihanFoto_kebersihanId_fkey" FOREIGN KEY ("kebersihanId") REFERENCES "KebersihanSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerangkatAntenna" ADD CONSTRAINT "PerangkatAntenna_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerangkatAntenna" ADD CONSTRAINT "PerangkatAntenna_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerangkatFoto" ADD CONSTRAINT "PerangkatFoto_perangkatId_fkey" FOREIGN KEY ("perangkatId") REFERENCES "PerangkatAntenna"("id") ON DELETE CASCADE ON UPDATE CASCADE;
