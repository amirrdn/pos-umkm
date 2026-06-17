declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      outletId?: string | null;

      user?: {
        id: string;
        tenantId: string;
        name: string;
        email: string;
        roles: string[];
        permissions: string[];
        outletId?: string | null;
      };
    }
  }
}

export { };
