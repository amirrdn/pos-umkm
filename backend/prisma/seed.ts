import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database...');

  // ==========================================
  // a. SEEDING TENANT
  // ==========================================
  // Menggunakan ID statis agar sinkron dengan mock tenant di frontend/backend
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-uuid-xyz-123' },
    update: {},
    create: {
      id: 'tenant-uuid-xyz-123',
      name: 'Toko Utama',
      slug: 'toko-utama',
      email: 'info@tokoutama.com',
      phone: '081234567890',
      status: 'ACTIVE'
    }
  });
  console.log('🏢 Tenant [Toko Utama] berhasil di-seed.');

  // ==========================================
  // b. SEEDING PERMISSIONS (GLOBAL)
  // ==========================================
  const permissionsData = [
    {
      name: 'create-transaction',
      moduleName: 'transactions',
      description: 'Izin untuk membuat transaksi penjualan baru (Kasir)'
    },
    {
      name: 'view:transactions',
      moduleName: 'transactions',
      description: 'Izin untuk melihat riwayat transaksi'
    },
    {
      name: 'view:products',
      moduleName: 'products',
      description: 'Izin untuk melihat daftar produk'
    },
    {
      name: 'create:products',
      moduleName: 'products',
      description: 'Izin untuk membuat produk baru'
    },
    {
      name: 'update:products',
      moduleName: 'products',
      description: 'Izin untuk memperbarui data produk'
    },
    {
      name: 'delete:products',
      moduleName: 'products',
      description: 'Izin untuk menghapus produk (Soft Delete)'
    },
    {
      name: 'view:customers',
      moduleName: 'customers',
      description: 'Izin untuk melihat daftar pelanggan'
    },
    {
      name: 'create:customers',
      moduleName: 'customers',
      description: 'Izin untuk membuat pelanggan baru'
    },
    {
      name: 'update:customers',
      moduleName: 'customers',
      description: 'Izin untuk memperbarui data pelanggan'
    },
    {
      name: 'delete:customers',
      moduleName: 'customers',
      description: 'Izin untuk menghapus pelanggan'
    }
  ];

  const permissions = [];
  for (const item of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: item.name },
      update: {},
      create: item
    });
    permissions.push(perm);
  }
  console.log(`🔑 ${permissions.length} Hak Akses (Permissions) berhasil di-seed.`);

  // ==========================================
  // c. SEEDING ROLE (OWNER) & HUBUNGKAN DENGAN PERMISSIONS
  // ==========================================
  const roleOwner = await prisma.role.upsert({
    where: { id: 'role-owner-uuid-444' },
    update: {},
    create: {
      id: 'role-owner-uuid-444',
      tenantId: tenant.id,
      name: 'Owner',
      description: 'Pemilik Toko dengan kontrol dan izin akses penuh'
    }
  });

  // Hubungkan Role Owner ke seluruh Permission yang telah dibuat
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleOwner.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: roleOwner.id,
        permissionId: perm.id
      }
    });
  }
  console.log('👑 Peran [Owner] dan pemetaan Hak Akses berhasil di-seed.');

  // Seeding Peran Kasir
  const roleKasir = await prisma.role.upsert({
    where: { id: 'role-kasir-uuid-555' },
    update: {},
    create: {
      id: 'role-kasir-uuid-555',
      tenantId: tenant.id,
      name: 'Kasir',
      description: 'Kasir toko dengan izin membuat transaksi dan melihat katalog produk'
    }
  });

  // Hubungkan Peran Kasir dengan permission 'create-transaction', 'view:products', 'view:customers', 'create:customers'
  const kasirPermissions = ['create-transaction', 'view:products', 'view:customers', 'create:customers'];
  for (const permName of kasirPermissions) {
    const matchedPerm = permissions.find(p => p.name === permName);
    if (matchedPerm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleKasir.id,
            permissionId: matchedPerm.id
          }
        },
        update: {},
        create: {
          roleId: roleKasir.id,
          permissionId: matchedPerm.id
        }
      });
    }
  }
  console.log('Peran [Kasir] dan pemetaan Hak Akses berhasil di-seed.');

  // d. SEEDING USER (ADMIN/OWNER & KASIR)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // User Owner
  const user = await prisma.user.upsert({
    where: { email: 'owner@tokoutama.com' },
    update: {
      password: hashedPassword // Selalu reset password ke default saat seed
    },
    create: {
      id: 'user-admin-111',
      tenantId: tenant.id,
      name: 'Budi Owner',
      email: 'owner@tokoutama.com',
      password: hashedPassword,
      isActive: true
    }
  });

  // Hubungkan User Owner ke Role Owner
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
  console.log('👤 Pengguna [Budi Owner] dan asosiasi Peran Owner berhasil di-seed.');

  // User Kasir
  const kasirUser = await prisma.user.upsert({
    where: { email: 'kasir@tokoutama.com' },
    update: {
      password: hashedPassword // Reset password ke default saat seed
    },
    create: {
      id: 'user-kasir-222',
      tenantId: tenant.id,
      name: 'Asep Kasir',
      email: 'kasir@tokoutama.com',
      password: hashedPassword,
      isActive: true
    }
  });

  // Hubungkan User Kasir ke Role Kasir
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: kasirUser.id,
        roleId: roleKasir.id
      }
    },
    update: {},
    create: {
      userId: kasirUser.id,
      roleId: roleKasir.id
    }
  });
  console.log('👤 Pengguna [Asep Kasir] dan asosiasi Peran Kasir berhasil di-seed.');

  // ==========================================
  // e. SEEDING KATEGORI & PRODUK (SINKRON DENGAN FRONTEND)
  // ==========================================
  
  // 1. Kategori
  const catMinuman = await prisma.category.upsert({
    where: { id: 'cat-minuman-111' },
    update: {},
    create: {
      id: 'cat-minuman-111',
      tenantId: tenant.id,
      name: 'Minuman',
      slug: 'minuman'
    }
  });

  const catMakanan = await prisma.category.upsert({
    where: { id: 'cat-makanan-222' },
    update: {},
    create: {
      id: 'cat-makanan-222',
      tenantId: tenant.id,
      name: 'Makanan',
      slug: 'makanan'
    }
  });
  console.log('📂 Kategori produk [Makanan] & [Minuman] berhasil di-seed.');

  // 2. Produk (Menggunakan UUID yang sama dengan frontend PosView.tsx)
  const productsData = [
    {
      id: 'e281bbcf-71d5-451e-9276-2e8df31cf81f',
      tenantId: tenant.id,
      categoryId: catMinuman.id,
      name: 'Kopi Susu Gula Aren',
      sku: 'PROD-001',
      purchasePrice: 10000,
      sellingPrice: 18000,
      stock: 25
    },
    {
      id: 'e281bbcf-72d5-451e-9276-2e8df31cf82f',
      tenantId: tenant.id,
      categoryId: catMakanan.id,
      name: 'Roti Bakar Cokelat Keju',
      sku: 'PROD-002',
      purchasePrice: 9000,
      sellingPrice: 15000,
      stock: 15
    },
    {
      id: 'e281bbcf-73d5-451e-9276-2e8df31cf83f',
      tenantId: tenant.id,
      categoryId: catMakanan.id,
      name: 'Croissant Mentega Premium',
      sku: 'PROD-003',
      purchasePrice: 14000,
      sellingPrice: 22000,
      stock: 8
    },
    {
      id: 'e281bbcf-74d5-451e-9276-2e8df31cf84f',
      tenantId: tenant.id,
      categoryId: catMinuman.id,
      name: 'Es Teh Manis Jasmine',
      sku: 'PROD-004',
      purchasePrice: 3000,
      sellingPrice: 6000,
      stock: 50
    },
    {
      id: 'e281bbcf-75d5-451e-9276-2e8df31cf85f',
      tenantId: tenant.id,
      categoryId: catMinuman.id,
      name: 'Matcha Latte Premium',
      sku: 'PROD-005',
      purchasePrice: 15000,
      sellingPrice: 24000,
      stock: 12
    }
  ];

  for (const item of productsData) {
    await prisma.product.upsert({
      where: { id: item.id },
      update: {
        stock: item.stock, // Reset stok saat seeding
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice
      },
      create: item
    });
  }
  console.log(`📦 ${productsData.length} Data Produk berhasil di-seed.`);

  // f. SEEDING CUSTOMERS
  console.log('👥 Seeding data pelanggan...');
  const customersData = [
    {
      id: 'cust-uuid-111',
      tenantId: tenant.id,
      name: 'Budi Santoso',
      phone: '081234567001',
      email: 'budi.santoso@gmail.com',
      points: 120
    },
    {
      id: 'cust-uuid-222',
      tenantId: tenant.id,
      name: 'Siti Rahma',
      phone: '081234567002',
      email: 'siti.rahma@yahoo.com',
      points: 50
    },
    {
      id: 'cust-uuid-333',
      tenantId: tenant.id,
      name: 'Joko Widodo',
      phone: '081234567003',
      email: 'joko.widodo@outlook.com',
      points: 0
    }
  ];

  for (const cust of customersData) {
    await prisma.customer.upsert({
      where: { id: cust.id },
      update: {
        points: cust.points
      },
      create: cust
    });
  }
  console.log(`👥 ${customersData.length} Pelanggan berhasil di-seed.`);
  console.log('✅ Proses seeding database selesai dengan sukses! 🎉');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Putuskan hubungan koneksi Prisma Client
    await prisma.$disconnect();
  });
