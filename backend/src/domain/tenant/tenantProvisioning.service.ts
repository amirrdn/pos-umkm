import { PrismaTx } from '../../lib/prisma';

export class TenantProvisioningService {
  /**
   * Initializes default roles and permissions for a newly created Tenant.
   */
  static async provisionDefaultRoles(
    tx: PrismaTx,
    tenantId: string
  ): Promise<Record<string, string>> {
    const permissions = await tx.permission.findMany();
    
    // Create Owner role
    const roleOwner = await tx.role.create({
      data: {
        tenantId,
        name: 'Owner',
        description: 'Pemilik Toko dengan kontrol dan izin akses penuh'
      }
    });
    const ownerPermissionsData = permissions.map((perm) => ({
      roleId: roleOwner.id,
      permissionId: perm.id
    }));
    await tx.rolePermission.createMany({ data: ownerPermissionsData });

    // Create Manager role
    const roleManager = await tx.role.create({
      data: {
        tenantId,
        name: 'Manager',
        description: 'Pengelola operasional toko dengan hak penuh atas transaksi, produk, pelanggan, staf, dan laporan keuangan'
      }
    });
    const managerPermissionsData = permissions.map((perm) => ({
      roleId: roleManager.id,
      permissionId: perm.id
    }));
    await tx.rolePermission.createMany({ data: managerPermissionsData });

    // Create Staf Gudang role
    const roleStafGudang = await tx.role.create({
      data: {
        tenantId,
        name: 'Staf Gudang',
        description: 'Pengelola logistik, melihat/menambah/mengubah data produk serta mutasi stok'
      }
    });
    const gudangPermissions = ['view:products', 'create:products', 'update:products'];
    const gudangPermissionsData = permissions
      .filter(p => gudangPermissions.includes(p.name))
      .map((perm) => ({
        roleId: roleStafGudang.id,
        permissionId: perm.id
      }));
    await tx.rolePermission.createMany({ data: gudangPermissionsData });

    // Create Kasir role
    const roleKasir = await tx.role.create({
      data: {
        tenantId,
        name: 'Kasir',
        description: 'Kasir toko dengan izin membuat transaksi dan melihat katalog produk'
      }
    });
    const kasirPermissions = ['create-transaction', 'view:products', 'view:customers', 'create:customers'];
    const kasirPermissionsData = permissions
      .filter(p => kasirPermissions.includes(p.name))
      .map((perm) => ({
        roleId: roleKasir.id,
        permissionId: perm.id
      }));
    await tx.rolePermission.createMany({ data: kasirPermissionsData });

    return {
      Owner: roleOwner.id,
      Manager: roleManager.id,
      StafGudang: roleStafGudang.id,
      Kasir: roleKasir.id,
    };
  }
}
