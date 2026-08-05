import { PrismaTx } from '../../lib/prisma';

/**
 * ============================================================================
 * SERVICE: TENANT PROVISIONING SERVICE
 * ============================================================================
 * Provisions baseline RBAC roles (Owner, Manager, Staf Gudang, Kasir) and maps
 * appropriate permissions for newly onboarded tenants.
 * ============================================================================
 */
export class TenantProvisioningService {
  /**
   * Provisions default RBAC roles and permission mappings for a new tenant.
   *
   * @param tx Active Prisma transaction context.
   * @param tenantId The unique identifier of the tenant being provisioned.
   * @returns Map of role names to created Role IDs.
   */
  static async provisionDefaultRoles(
    tx: PrismaTx,
    tenantId: string
  ): Promise<Record<string, string>> {
    const permissions = await tx.permission.findMany();
    
    /**
     * 1. Provision Owner Role (Full Tenant Access)
     */
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

    /**
     * 2. Provision Manager Role (Full Operational Access)
     */
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

    /**
     * 3. Provision Warehouse Staff Role (Product & Stock Access)
     */
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

    /**
     * 4. Provision Cashier Role (POS Checkout & Customer Access)
     */
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
