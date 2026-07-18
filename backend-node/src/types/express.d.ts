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
    }

    interface Locals {
      validated?: unknown;
    }
  }
}

export {};
