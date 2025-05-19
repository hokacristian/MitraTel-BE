import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper function to generate random integers
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const wilayahData = [
    {
      nama: 'Jakarta Selatan',
      towers: [
        { 
          nama: 'Tower JS 001', 
          latitude: -6.2607, 
          longitude: 106.7816,
          antenaRRU: getRandomInt(1, 5),
          antenaRF: getRandomInt(2, 8),
          antenaMW: getRandomInt(1, 3)
        },
        { 
          nama: 'Tower JS 002', 
          latitude: -6.2610, 
          longitude: 106.7820,
          antenaRRU: getRandomInt(1, 5),
          antenaRF: getRandomInt(2, 8),
          antenaMW: getRandomInt(1, 3)
        },
      ],
    },
    {
      nama: 'Bandung',
      towers: [
        { 
          nama: 'Tower BDG 001', 
          latitude: -6.9147, 
          longitude: 107.6098,
          antenaRRU: getRandomInt(1, 5),
          antenaRF: getRandomInt(2, 8),
          antenaMW: getRandomInt(1, 3)
        },
        { 
          nama: 'Tower BDG 002', 
          latitude: -6.9150, 
          longitude: 107.6100,
          antenaRRU: getRandomInt(1, 5),
          antenaRF: getRandomInt(2, 8),
          antenaMW: getRandomInt(1, 3)
        },
      ],
    },
    {
      nama: 'Surabaya',
      towers: [
        { 
          nama: 'Tower SBY 001', 
          latitude: -7.2575, 
          longitude: 112.7521,
          antenaRRU: getRandomInt(1, 5),
          antenaRF: getRandomInt(2, 8),
          antenaMW: getRandomInt(1, 3)
        },
        { 
          nama: 'Tower SBY 002', 
          latitude: -7.2578, 
          longitude: 112.7530,
          antenaRRU: getRandomInt(1, 5),
          antenaRF: getRandomInt(2, 8),
          antenaMW: getRandomInt(1, 3)
        },
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