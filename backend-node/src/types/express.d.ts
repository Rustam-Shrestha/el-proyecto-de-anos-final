/* Extend Express User type used in request.user */
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      isVerified?: boolean;
    }

    type ValidatedRequestPayload = {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    interface Request {
      user?: User;
      validated?: unknown;
      tenantId?: number;
      tenantSlug?: string;
      permissions?: string[];
    }

    interface Locals {
      validated?: unknown;
    }
  }
}

export {};
