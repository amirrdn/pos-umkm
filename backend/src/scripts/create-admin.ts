import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

async function run() {
  require('dotenv').config();
  const dbUrl = process.argv[2] || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Silakan masukkan DATABASE_URL sebagai argumen atau set di file .env!');
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
        tenantId,
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

    console.log(`Menghapus seluruh hubungan role lama untuk ${email}...`);
    await prisma.userRole.deleteMany({
      where: { userId: user.id }
    });

    console.log(`Menghubungkan ke role platform Admin...`);
    const rolePlatformAdmin = await prisma.role.findFirst({
      where: { name: 'Admin', tenantId: null }
    });
    if (rolePlatformAdmin) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: rolePlatformAdmin.id
        }
      });
      console.log('Hubungan ke role platform Admin berhasil.');
    }

    console.log(`Menghapus seluruh hubungan outlet lama untuk ${email}...`);
    await prisma.userOutlet.deleteMany({
      where: { userId: user.id }
    });

    console.log(`Menghubungkan ke outlet...`);
    const outlet = await prisma.outlet.findUnique({ where: { id: outletId } });
    if (outlet) {
      await prisma.userOutlet.create({
        data: {
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
