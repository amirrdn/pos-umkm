declare global {
  namespace Express {
    interface Request {
      tenantId?: string;

      user?: {
        id: string;
        tenantId: string;
        name: string;
        email: string;
        roles: string[];
        permissions: string[];
      };
    }
  }
}

export { };
