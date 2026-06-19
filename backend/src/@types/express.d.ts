declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      outletId?: string | null;
      isGlobalAdmin?: boolean;

      user?: {
        id: string;
        tenantId: string;
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
