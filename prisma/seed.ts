import {
  MonthlyReportStatus,
  PrismaClient,
  Role,
  StaffPosition,
} from '@prisma/client';

const prisma = new PrismaClient();

const REGIONS_SOURCE_URL =
  process.env.UZ_REGIONS_SOURCE_URL ??
  'https://raw.githubusercontent.com/MIMAXUZ/uzbekistan-regions-data/master/JSON/regions.json';
const DISTRICTS_SOURCE_URL =
  process.env.UZ_DISTRICTS_SOURCE_URL ??
  'https://raw.githubusercontent.com/MIMAXUZ/uzbekistan-regions-data/master/JSON/districts.json';
const VILLAGES_SOURCE_URL =
  process.env.UZ_VILLAGES_SOURCE_URL ??
  'https://raw.githubusercontent.com/MIMAXUZ/uzbekistan-regions-data/master/JSON/villages.json';

type ExternalNamePayload = {
  name_uz?: string | null;
  name_oz?: string | null;
  name_ru?: string | null;
  name?: string | null;
};

type ExternalRegion = ExternalNamePayload & {
  id: number;
};

type ExternalDistrict = ExternalNamePayload & {
  id: number;
  region_id: number;
};

type ExternalVillage = ExternalNamePayload & {
  id: number;
  district_id: number;
};

const normalizeName = (payload: ExternalNamePayload) => {
  const raw =
    payload.name_uz ??
    payload.name_oz ??
    payload.name_ru ??
    payload.name ??
    '';

  return String(raw).replace(/\s+/g, ' ').trim();
};

const chunk = <T>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return (await response.json()) as T;
};

const ensureFallbackLocation = async () => {
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

  return mahalla.id;
};

const seedLocationsFromRemote = async () => {
  const [regionsPayload, districtsPayload, villagesPayload] = await Promise.all([
    fetchJson<ExternalRegion[]>(REGIONS_SOURCE_URL),
    fetchJson<ExternalDistrict[]>(DISTRICTS_SOURCE_URL),
    fetchJson<ExternalVillage[]>(VILLAGES_SOURCE_URL),
  ]);

  const uniqueRegionNames = new Set<string>();
  for (const region of regionsPayload) {
    const name = normalizeName(region);
    if (name) {
      uniqueRegionNames.add(name);
    }
  }

  if (uniqueRegionNames.size === 0) {
    throw new Error('Remote regions payload is empty.');
  }

  await prisma.region.createMany({
    data: Array.from(uniqueRegionNames).map((name) => ({ name })),
    skipDuplicates: true,
  });

  const dbRegions = await prisma.region.findMany({
    select: { id: true, name: true },
  });
  const dbRegionIdByName = new Map<string, string>(
    dbRegions.map((region) => [region.name, region.id]),
  );

  const dbRegionIdByExternalId = new Map<number, string>();
  for (const externalRegion of regionsPayload) {
    const regionName = normalizeName(externalRegion);
    const dbRegionId = dbRegionIdByName.get(regionName);
    if (dbRegionId) {
      dbRegionIdByExternalId.set(externalRegion.id, dbRegionId);
    }
  }

  const districtSeedData: Array<{ regionId: string; name: string }> = [];
  const districtKeyByExternalId = new Map<number, string>();
  const seenDistrictKeys = new Set<string>();

  for (const district of districtsPayload) {
    const districtName = normalizeName(district);
    const dbRegionId = dbRegionIdByExternalId.get(district.region_id);
    if (!districtName || !dbRegionId) {
      continue;
    }

    const districtKey = `${dbRegionId}::${districtName.toLowerCase()}`;
    districtKeyByExternalId.set(district.id, districtKey);

    if (seenDistrictKeys.has(districtKey)) {
      continue;
    }
    seenDistrictKeys.add(districtKey);
    districtSeedData.push({
      regionId: dbRegionId,
      name: districtName,
    });
  }

  if (districtSeedData.length > 0) {
    await prisma.district.createMany({
      data: districtSeedData,
      skipDuplicates: true,
    });
  }

  const dbDistricts = await prisma.district.findMany({
    select: { id: true, regionId: true, name: true },
  });
  const dbDistrictIdByKey = new Map<string, string>(
    dbDistricts.map((district) => [
      `${district.regionId}::${district.name.toLowerCase()}`,
      district.id,
    ]),
  );

  const dbDistrictIdByExternalId = new Map<number, string>();
  for (const [externalDistrictId, districtKey] of districtKeyByExternalId.entries()) {
    const dbDistrictId = dbDistrictIdByKey.get(districtKey);
    if (dbDistrictId) {
      dbDistrictIdByExternalId.set(externalDistrictId, dbDistrictId);
    }
  }

  const mahallaSeedData: Array<{ districtId: string; name: string }> = [];
  const seenMahallaKeys = new Set<string>();

  for (const village of villagesPayload) {
    const villageName = normalizeName(village);
    const dbDistrictId = dbDistrictIdByExternalId.get(village.district_id);
    if (!villageName || !dbDistrictId) {
      continue;
    }

    const mahallaKey = `${dbDistrictId}::${villageName.toLowerCase()}`;
    if (seenMahallaKeys.has(mahallaKey)) {
      continue;
    }
    seenMahallaKeys.add(mahallaKey);
    mahallaSeedData.push({
      districtId: dbDistrictId,
      name: villageName,
    });
  }

  for (const batch of chunk(mahallaSeedData, 1000)) {
    await prisma.mahalla.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  const preferredMahalla = await prisma.mahalla.findFirst({
    where: {
      district: {
        name: { contains: 'Yunusobod', mode: 'insensitive' },
        region: {
          name: { contains: 'Toshkent', mode: 'insensitive' },
        },
      },
    },
    orderBy: { name: 'asc' },
    select: { id: true },
  });

  if (preferredMahalla) {
    return preferredMahalla.id;
  }

  const anyMahalla = await prisma.mahalla.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (anyMahalla) {
    return anyMahalla.id;
  }

  return ensureFallbackLocation();
};

async function main() {
  let seedMahallaId = '';
  try {
    seedMahallaId = await seedLocationsFromRemote();
    console.log('Location seed source: remote dataset');
  } catch (error) {
    console.warn('Remote location seed failed. Falling back to local minimal seed.');
    console.warn(error);
    seedMahallaId = await ensureFallbackLocation();
  }

  const superAdmin = await prisma.user.upsert({
    where: { phone: '+998949395123' },
    update: {
      fullName: 'System Super Admin',
      role: Role.SUPER_ADMIN,
      mahallaId: seedMahallaId,
      deletedAt: null,
    },
    create: {
      phone: '+998949395123',
      fullName: 'System Super Admin',
      role: Role.SUPER_ADMIN,
      mahallaId: seedMahallaId,
    },
  });

  const staff = await prisma.user.upsert({
    where: { phone: '+998949395124' },
    update: {
      fullName: 'Mahalla Chairperson',
      role: Role.STAFF,
      mahallaId: seedMahallaId,
      deletedAt: null,
    },
    create: {
      phone: '+998949395124',
      fullName: 'Mahalla Chairperson',
      role: Role.STAFF,
      mahallaId: seedMahallaId,
    },
  });

  await prisma.user.upsert({
    where: { phone: '+998949395125' },
    update: {
      fullName: 'Test Resident',
      role: Role.RESIDENT,
      mahallaId: seedMahallaId,
      deletedAt: null,
    },
    create: {
      phone: '+998949395125',
      fullName: 'Test Resident',
      role: Role.RESIDENT,
      mahallaId: seedMahallaId,
    },
  });

  await prisma.staffProfile.deleteMany({
    where: { userId: superAdmin.id },
  });

  await prisma.staffProfile.upsert({
    where: { userId: staff.id },
    update: {
      position: StaffPosition.CHAIRPERSON,
      twoFaRequired: true,
    },
    create: {
      userId: staff.id,
      position: StaffPosition.CHAIRPERSON,
      twoFaRequired: true,
    },
  });

  const reports = [
    {
      month: '2026-01',
      summary: 'Yanvar oy hisobot',
      items: [
        {
          workName: "Ko'cha yoritgichlarini ta'mirlash",
          workDate: '2026-01-20T00:00:00.000Z',
          resultText: '12 ta yoritgich to‘liq ishga tushirildi.',
        },
      ],
    },
    {
      month: '2025-12',
      summary: 'Dekabr oy hisobot',
      items: [
        {
          workName: 'Qor mavsumi uchun tayyorgarlik',
          workDate: '2025-12-18T00:00:00.000Z',
          resultText: 'Asosiy yo‘laklar tozalash jadvali tasdiqlandi.',
        },
      ],
    },
  ] as const;

  for (const reportEntry of reports) {
    const monthDate = new Date(`${reportEntry.month}-01T00:00:00.000Z`);

    await prisma.monthlyReport.upsert({
      where: {
        mahallaId_month: {
          mahallaId: seedMahallaId,
          month: monthDate,
        },
      },
      update: {
        summary: reportEntry.summary,
        status: MonthlyReportStatus.SUBMITTED,
        submittedById: staff.id,
        deletedAt: null,
        items: {
          deleteMany: {},
          create: reportEntry.items.map((item) => ({
            workName: item.workName,
            workDate: new Date(item.workDate),
            resultText: item.resultText,
          })),
        },
      },
      create: {
        mahallaId: seedMahallaId,
        month: monthDate,
        summary: reportEntry.summary,
        status: MonthlyReportStatus.SUBMITTED,
        submittedById: staff.id,
        items: {
          create: reportEntry.items.map((item) => ({
            workName: item.workName,
            workDate: new Date(item.workDate),
            resultText: item.resultText,
          })),
        },
      },
    });
  }
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
