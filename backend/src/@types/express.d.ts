declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      outletId?: string | null;
      /** Outlet ter-resolve dari x-outlet-id (setelah attachActiveOutlet). */
      activeOutlet?: {
        id: string;
        name: string;
        type: 'MAIN' | 'BRANCH';
        isActive: boolean;
      } | null;
      /** Owner, Manager, atau Admin platform — boleh scope outlet bebas / agregat */
      hasTenantWideOutletAccess?: boolean;
      /** Pemilik aplikasi SaaS (bukan pemilik toko) */
      isPlatformAdmin?: boolean;
      /** URL gambar produk yang diunggah ke Cloudinary. */
      fileUrl?: string;

      user?: {
        id: string;
        tenantId: string | null;
        name: string;
        email: string;
        roles: string[];
        permissions: string[];
        outletIds?: string[];
      };
    }
  }
}

export { };
