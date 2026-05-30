/* Extend Express User type used in request.user */
declare namespace Express {
  interface User {
    id: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
  }
}
import type { Request } from 'express';

declare global {
  namespace Express {
    type ValidatedRequestPayload = {
      body?: unknown;
      params?: unknown;
      query?: unknown;
    };

    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      validated?: unknown;
    }

    interface Locals {
      validated?: unknown;
    }
  }
}

export {};
