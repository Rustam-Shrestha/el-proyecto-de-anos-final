import { env } from '@/config/env';

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FinGuard Multi-Tenant Loan API',
    description: 'Multi-tenant fintech platform with role-based access control (slug tenancy: /:slug/login, /:slug/apply; compat shims over /api/v1)',
    version: '1.0.0',
    contact: {
      name: 'FinGuard Support',
      email: 'support@finguard.io',
    },
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token authentication',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'KYC', description: 'KYC application endpoints' },
    { name: 'Documents', description: 'Document upload and management' },
    { name: 'Audit', description: 'Audit logging endpoints' },
    { name: 'Health', description: 'System health checks' },
  ],
};

export { openApiSpec };
