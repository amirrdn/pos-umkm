/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient, type Permission } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * ============================================================================
 * PRIMARY SEEDING SCRIPT: SAAS POS SYSTEM FOUNDATION
 * ============================================================================
 * Seeds baseline tenant, default main outlet, global permissions, core RBAC
 * roles (Platform Admin, Owner, Manager, Cashier, Warehouse Staff), demo users,
 * product catalog with categories and stock levels, and customer directory.
 * ============================================================================
 */
async function main() {
  console.log('🌱 Starting primary database seeding...');

  /**
   * 1. Seed Tenant Context
   */
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-uuid-xyz-123' },
    update: {},
    create: {
      id: 'tenant-uuid-xyz-123',
      name: 'Toko Utama',
      slug: 'toko-utama',
      email: process.env.SEED_TENANT_EMAIL || 'info@example.com',
      phone: '081234567890',
      status: 'ACTIVE',
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiresAt: new Date('2027-12-31T23:59:59Z')
    }
  });
  console.log('🏢 Tenant [Toko Utama] seeded successfully.');

  /**
   * 2. Seed Default Main Outlet
   */
  await prisma.outlet.upsert({
    where: { id: 'outlet-default-uuid-111' },
    update: { type: 'MAIN' },
    create: {
      id: 'outlet-default-uuid-111',
      tenantId: tenant.id,
      name: 'Toko Utama Pusat',
      type: 'MAIN',
      code: 'PST',
      address: 'Jl. Jenderal Sudirman No. 1, Jakarta',
      phone: '021-5551234'
    }
  });
  console.log('🏪 Main Outlet [Toko Utama Pusat] seeded successfully.');

  /**
   * 3. Seed Global Permissions Catalog
   */
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

  const permissions: Permission[] = [];
  for (const item of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: item.name },
      update: {},
      create: item
    });
    permissions.push(perm);
  }
  console.log(`🔑 ${permissions.length} Global Permissions seeded successfully.`);

  /**
   * 4. Seed Platform Admin Role & Permission Mappings
   */
  const rolePlatformAdmin = await prisma.role.upsert({
    where: { id: 'role-platform-admin-uuid-001' },
    update: {},
    create: {
      id: 'role-platform-admin-uuid-001',
      tenantId: null,
      name: 'Admin',
      description: 'Administrator platform SaaS UMKM — akses lintas tenant dan seluruh fitur sistem',
    },
  });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: rolePlatformAdmin.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: rolePlatformAdmin.id,
        permissionId: perm.id,
      },
    });
  }
  console.log('🛡️ Platform Role [Admin] seeded successfully.');

  /**
   * 5. Seed Owner Role & Permission Mappings
   */
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
  console.log('👑 Tenant Role [Owner] seeded successfully.');

  /**
   * 6. Seed Cashier Role & Permission Mappings
   */
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
  console.log('🛒 Tenant Role [Kasir] seeded successfully.');

  /**
   * 7. Seed Manager Role & Permission Mappings
   */
  const roleManager = await prisma.role.upsert({
    where: { id: 'role-manager-uuid-666' },
    update: {},
    create: {
      id: 'role-manager-uuid-666',
      tenantId: tenant.id,
      name: 'Manager',
      description: 'Pengelola operasional toko dengan hak penuh atas transaksi, produk, pelanggan, staf, dan laporan keuangan'
    }
  });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roleManager.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: roleManager.id,
        permissionId: perm.id
      }
    });
  }
  console.log('👔 Tenant Role [Manager] seeded successfully.');

  /**
   * 8. Seed Warehouse Staff Role & Permission Mappings
   */
  const roleStafGudang = await prisma.role.upsert({
    where: { id: 'role-staf-gudang-uuid-777' },
    update: {},
    create: {
      id: 'role-staf-gudang-uuid-777',
      tenantId: tenant.id,
      name: 'Staf Gudang',
      description: 'Pengelola logistik, melihat/menambah/mengubah data produk serta mutasi stok'
    }
  });

  const gudangPermissions = ['view:products', 'create:products', 'update:products'];
  for (const permName of gudangPermissions) {
    const matchedPerm = permissions.find(p => p.name === permName);
    if (matchedPerm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleStafGudang.id,
            permissionId: matchedPerm.id
          }
        },
        update: {},
        create: {
          roleId: roleStafGudang.id,
          permissionId: matchedPerm.id
        }
      });
    }
  }
  console.log('📦 Tenant Role [Staf Gudang] seeded successfully.');

  /**
   * 9. Seed Demo Users (Owner & Cashier Accounts)
   */
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@example.com';
  const user = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      password: hashedPassword,
      approvalStatus: 'APPROVED',
    },
    create: {
      id: 'user-admin-111',
      tenantId: tenant.id,
      name: 'Budi Owner',
      email: ownerEmail,
      password: hashedPassword,
      isActive: true,
      approvalStatus: 'APPROVED',
    }
  });

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

  await prisma.userOutlet.upsert({
    where: {
      userId_outletId: {
        userId: user.id,
        outletId: 'outlet-default-uuid-111'
      }
    },
    update: {},
    create: {
      userId: user.id,
      outletId: 'outlet-default-uuid-111'
    }
  });
  console.log('👤 Demo User [Owner] seeded successfully.');

  const kasirEmail = process.env.SEED_KASIR_EMAIL || 'kasir@example.com';
  const kasirUser = await prisma.user.upsert({
    where: { email: kasirEmail },
    update: {
      password: hashedPassword,
      approvalStatus: 'APPROVED',
    },
    create: {
      id: 'user-kasir-222',
      tenantId: tenant.id,
      name: 'Asep Kasir',
      email: kasirEmail,
      password: hashedPassword,
      isActive: true,
      approvalStatus: 'APPROVED',
    }
  });

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

  await prisma.userOutlet.upsert({
    where: {
      userId_outletId: {
        userId: kasirUser.id,
        outletId: 'outlet-default-uuid-111'
      }
    },
    update: {},
    create: {
      userId: kasirUser.id,
      outletId: 'outlet-default-uuid-111'
    }
  });
  console.log('👤 Demo User [Kasir] seeded successfully.');

  /**
   * 10. Seed Product Categories & Product Catalog
   */
  const catMinuman = await prisma.category.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'minuman' },
    },
    update: {
      prefix: 'MNM',
      name: 'Minuman',
    },
    create: {
      id: 'cat-minuman-111',
      tenantId: tenant.id,
      name: 'Minuman',
      slug: 'minuman',
      prefix: 'MNM',
    },
  });

  const catMakanan = await prisma.category.upsert({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: 'makanan' },
    },
    update: {
      prefix: 'MKN',
      name: 'Makanan',
    },
    create: {
      id: 'cat-makanan-222',
      tenantId: tenant.id,
      name: 'Makanan',
      slug: 'makanan',
      prefix: 'MKN',
    },
  });
  console.log('📂 Product Categories [Food & Beverage] seeded successfully.');

  const productsData = [
    {
      id: 'e281bbcf-71d5-451e-9276-2e8df31cf81f',
      tenantId: tenant.id,
      categoryId: catMinuman.id,
      name: 'Kopi Susu Gula Aren',
      sku: 'PROD-001',
      purchasePrice: 10000,
      sellingPrice: 18000,
      initialStock: 25,
    },
    {
      id: 'e281bbcf-72d5-451e-9276-2e8df31cf82f',
      tenantId: tenant.id,
      categoryId: catMakanan.id,
      name: 'Roti Bakar Cokelat Keju',
      sku: 'PROD-002',
      purchasePrice: 9000,
      sellingPrice: 15000,
      initialStock: 15,
    },
    {
      id: 'e281bbcf-73d5-451e-9276-2e8df31cf83f',
      tenantId: tenant.id,
      categoryId: catMakanan.id,
      name: 'Croissant Mentega Premium',
      sku: 'PROD-003',
      purchasePrice: 14000,
      sellingPrice: 22000,
      initialStock: 8,
    },
    {
      id: 'e281bbcf-74d5-451e-9276-2e8df31cf84f',
      tenantId: tenant.id,
      categoryId: catMinuman.id,
      name: 'Es Teh Manis Jasmine',
      sku: 'PROD-004',
      purchasePrice: 3000,
      sellingPrice: 6000,
      initialStock: 50,
    },
    {
      id: 'e281bbcf-75d5-451e-9276-2e8df31cf85f',
      tenantId: tenant.id,
      categoryId: catMinuman.id,
      name: 'Matcha Latte Premium',
      sku: 'PROD-005',
      purchasePrice: 15000,
      sellingPrice: 24000,
      initialStock: 12,
    },
  ];

  for (const item of productsData) {
    await prisma.product.upsert({
      where: { id: item.id },
      update: {
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
      },
      create: {
        id: item.id,
        tenantId: item.tenantId,
        categoryId: item.categoryId,
        name: item.name,
        sku: item.sku,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
      },
    });

    await prisma.outletStock.upsert({
      where: {
        outletId_productId: {
          outletId: 'outlet-default-uuid-111',
          productId: item.id,
        },
      },
      update: {
        stock: item.initialStock,
      },
      create: {
        tenantId: tenant.id,
        outletId: 'outlet-default-uuid-111',
        productId: item.id,
        stock: item.initialStock,
      },
    });
  }
  console.log(`📦 ${productsData.length} Product records & OutletStock balances seeded successfully.`);

  /**
   * 11. Seed Product Images
   */
  const defaultImages = [
    {
      id: 'img-prod-001',
      productId: 'e281bbcf-71d5-451e-9276-2e8df31cf81f',
      url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=400&auto=format&fit=crop',
      isMain: true
    },
    {
      id: 'img-prod-002',
      productId: 'e281bbcf-72d5-451e-9276-2e8df31cf82f',
      url: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=400&auto=format&fit=crop',
      isMain: true
    },
    {
      id: 'img-prod-003',
      productId: 'e281bbcf-73d5-451e-9276-2e8df31cf83f',
      url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400&auto=format&fit=crop',
      isMain: true
    },
    {
      id: 'img-prod-004',
      productId: 'e281bbcf-74d5-451e-9276-2e8df31cf84f',
      url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400&auto=format&fit=crop',
      isMain: true
    },
    {
      id: 'img-prod-005',
      productId: 'e281bbcf-75d5-451e-9276-2e8df31cf85f',
      url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?q=80&w=400&auto=format&fit=crop',
      isMain: true
    }
  ];

  for (const img of defaultImages) {
    await prisma.productImage.upsert({
      where: { id: img.id },
      update: {
        url: img.url,
        isMain: img.isMain
      },
      create: img
    });
  }
  console.log('🖼️ Default Product Images seeded successfully.');

  /**
   * 12. Seed Customer Directory
   */
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
  console.log(`👥 ${customersData.length} Customer records seeded successfully.`);
  console.log('🎉 Primary database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during primary database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
