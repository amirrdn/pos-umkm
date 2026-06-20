import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

async function run() {
  const dbUrl = process.argv[2];
  if (!dbUrl) {
    console.error('Silakan masukkan DATABASE_URL sebagai argumen!');
    process.exit(1);
  }

  console.log(`Menghubungkan ke database...`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const email = '4mir.rdn@gmail.com';
    const password = 'password123';
    const tenantId = 'tenant-uuid-xyz-123';
    const outletId = 'outlet-default-uuid-111';

    console.log(`Mengecek tenant ${tenantId}...`);
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error(`Tenant dengan ID ${tenantId} tidak ditemukan. Silakan jalankan seeder terlebih dahulu.`);
    }

    console.log(`Meng-hash password...`);
    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = 'user-admin-amir-999';

    console.log(`Membuat/mengupdate user ${email}...`);
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        isActive: true,
        approvalStatus: 'APPROVED',
      },
      create: {
        id: userId,
        tenantId,
        name: 'Amir Admin',
        email,
        password: hashedPassword,
        isActive: true,
        approvalStatus: 'APPROVED',
      },
    });

    console.log(`Menghubungkan ke role Owner...`);
    const roleOwner = await prisma.role.findFirst({
      where: { name: 'Owner', tenantId }
    });
    if (roleOwner) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: roleOwner.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: roleOwner.id
        }
      });
      console.log('Hubungan ke role Owner berhasil.');
    }

    console.log(`Menghubungkan ke role platform Admin...`);
    const rolePlatformAdmin = await prisma.role.findFirst({
      where: { name: 'Admin', tenantId: null }
    });
    if (rolePlatformAdmin) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: rolePlatformAdmin.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: rolePlatformAdmin.id
        }
      });
      console.log('Hubungan ke role platform Admin berhasil.');
    }

    console.log(`Menghubungkan ke outlet...`);
    const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
    if (outlet) {
      await prisma.userOutlet.upsert({
        where: {
          userId_outletId: {
            userId: user.id,
            outletId
          }
        },
        update: {},
        create: {
          userId: user.id,
          outletId
        }
      });
      console.log('Hubungan ke default outlet berhasil.');
    }

    console.log(`✅ Sukses! User admin ${email} berhasil ditambahkan/diperbarui.`);
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
