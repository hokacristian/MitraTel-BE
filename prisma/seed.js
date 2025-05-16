import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const wilayahData = [
    {
      nama: 'Jakarta Selatan',
      towers: [
        { nama: 'Tower JS 001', latitude: -6.2607, longitude: 106.7816 },
        { nama: 'Tower JS 002', latitude: -6.2610, longitude: 106.7820 },
      ],
    },
    {
      nama: 'Bandung',
      towers: [
        { nama: 'Tower BDG 001', latitude: -6.9147, longitude: 107.6098 },
        { nama: 'Tower BDG 002', latitude: -6.9150, longitude: 107.6100 },
      ],
    },
    {
      nama: 'Surabaya',
      towers: [
        { nama: 'Tower SBY 001', latitude: -7.2575, longitude: 112.7521 },
        { nama: 'Tower SBY 002', latitude: -7.2578, longitude: 112.7530 },
      ],
    },
  ];

  for (const data of wilayahData) {
    await prisma.wilayah.create({
      data: {
        nama: data.nama,
        towers: {
          create: data.towers,
        },
      },
    });
  }
}

main()
  .then(() => {
    console.log('✅ Seeding selesai');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
