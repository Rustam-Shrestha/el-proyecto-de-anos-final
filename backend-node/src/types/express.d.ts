/* Extend Express User type used in request.user */
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      isVerified?: boolean;
      tenantId?: number;
      permissions?: string[];
    }

    type ValidatedRequestPayload = {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    interface CompatScope {
      user_id: string;
      role: string;
      company_id?: number;
      customer_id?: string;
      slug?: string;
    }

    interface Request {
      user?: User;
      validated?: unknown;
      tenantId?: number;
      tenantSlug?: string;
      /** true only when the client explicitly requested a tenant (x-tenant header, subdomain, ?tenant=) */
      tenantExplicit?: boolean;
      permissions?: string[];
      scope?: CompatScope;
    }

    interface Locals {
      validated?: unknown;
    }
  }
}

export {};
