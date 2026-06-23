import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { runInSystemContext } from '../lib/tenantContext';

async function run() {
  require('dotenv').config();
  const dbUrl = process.argv[2] || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Silakan masukkan DATABASE_URL sebagai argumen atau set di file .env!');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = dbUrl;
  }

  try {
    await runInSystemContext('script', async () => {
    const email = '4mir.rdn@gmail.com';
    const password = 'password123';
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
        tenantId: null,
      },
      create: {
        id: userId,
        tenantId: null,
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
    });
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
