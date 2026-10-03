declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
      tenantSlug?: string;
      permissions?: string[];
    }
    interface User {
      id: string;
      email: string;
      role: string;
      tenantId?: number;
      permissions?: string[];
    }
  }
}

export interface TenantContext {
  tenantId: number;
  tenantSlug: string;
  schemaName: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export {};
