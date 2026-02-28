import { PrismaClient, Role, StaffPosition } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const region = await prisma.region.upsert({
    where: { name: 'Toshkent Shahri' },
    update: {},
    create: { name: 'Toshkent Shahri' },
  });

  const district = await prisma.district.upsert({
    where: {
      regionId_name: {
        regionId: region.id,
        name: 'Yunusobod tumani',
      },
    },
    update: {},
    create: {
      regionId: region.id,
      name: 'Yunusobod tumani',
    },
  });

  const mahalla = await prisma.mahalla.upsert({
    where: {
      districtId_name: {
        districtId: district.id,
        name: 'Obod Mahalla',
      },
    },
    update: {},
    create: {
      districtId: district.id,
      name: 'Obod Mahalla',
    },
  });

  await prisma.user.upsert({
    where: { phone: '+998900000001' },
    update: {},
    create: {
      phone: '+998900000001',
      fullName: 'System Super Admin',
      role: Role.SUPER_ADMIN,
      mahallaId: mahalla.id,
    },
  });

  const staff = await prisma.user.upsert({
    where: { phone: '+998900000002' },
    update: {},
    create: {
      phone: '+998900000002',
      fullName: 'Mahalla Chairperson',
      role: Role.STAFF,
      mahallaId: mahalla.id,
    },
  });

  await prisma.staffProfile.upsert({
    where: { userId: staff.id },
    update: {},
    create: {
      userId: staff.id,
      position: StaffPosition.CHAIRPERSON,
      twoFaRequired: true,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
