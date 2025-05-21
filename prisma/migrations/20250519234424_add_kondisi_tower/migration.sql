-- CreateTable
CREATE TABLE "KondisiTower" (
    "id" SERIAL NOT NULL,
    "towerId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "kelengkapanBaut" TEXT,
    "jmlhBaut" INTEGER NOT NULL DEFAULT 0,
    "lvlKarat" TEXT,
    "jmlhKaratRingan" INTEGER NOT NULL DEFAULT 0,
    "jmlhKaratSedang" INTEGER NOT NULL DEFAULT 0,
    "jmlhKaratBerat" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KondisiTower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KondisiFoto" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "kondisiId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KondisiFoto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KondisiTower" ADD CONSTRAINT "KondisiTower_towerId_fkey" FOREIGN KEY ("towerId") REFERENCES "Tower"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KondisiTower" ADD CONSTRAINT "KondisiTower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KondisiFoto" ADD CONSTRAINT "KondisiFoto_kondisiId_fkey" FOREIGN KEY ("kondisiId") REFERENCES "KondisiTower"("id") ON DELETE CASCADE ON UPDATE CASCADE;
