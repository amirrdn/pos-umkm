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
    // Cari tenant secara dinamis:
    // 1. Cari berdasarkan slug 'toko-berkah-makmur'
    // 2. Jika tidak ada, cari tenant non-default pertama (yang bukan 'tenant-uuid-xyz-123')
    // 3. Fallback ke 'tenant-uuid-xyz-123' (seeder tenant)
    let tenant = await prisma.tenant.findUnique({ where: { slug: 'toko-berkah-makmur' } });
    if (!tenant) {
      tenant = await prisma.tenant.findFirst({
        where: { id: { not: 'tenant-uuid-xyz-123' } }
      });
    }
    if (!tenant) {
      tenant = await prisma.tenant.findUnique({ where: { id: 'tenant-uuid-xyz-123' } });
    }

    if (!tenant) {
      throw new Error('Tidak ada tenant sama sekali di database. Silakan jalankan seeder atau registrasi tenant terlebih dahulu.');
    }

    const tenantId = tenant.id;
    console.log(`Menggunakan tenant: ${tenant.name} (${tenantId})`);

    // Cari outlet secara dinamis:
    // 1. Cari outlet type 'MAIN' untuk tenant ini
    // 2. Jika tidak ada, cari outlet pertama untuk tenant ini
    let outlet = await prisma.outlet.findFirst({
      where: { tenantId, type: 'MAIN' }
    });
    if (!outlet) {
      outlet = await prisma.outlet.findFirst({
        where: { tenantId }
      });
    }

    if (!outlet) {
      throw new Error(`Tenant ${tenant.name} (${tenantId}) tidak memiliki outlet. Silakan buat outlet terlebih dahulu.`);
    }

    const outletId = outlet.id;
    console.log(`Outlet referensi tenant: ${outlet.name} (${outletId}) — tidak diikat ke platform admin.`);

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
    console.log('Platform Admin tidak diikat ke outlet tertentu (akses lintas tenant).');

    console.log(`✅ Sukses! User admin ${email} berhasil ditambahkan/diperbarui.`);
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
