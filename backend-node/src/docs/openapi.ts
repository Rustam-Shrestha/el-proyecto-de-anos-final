import fs from 'fs';
import path from 'path';
import swaggerJSDoc from 'swagger-jsdoc';
import { env } from '@/config/env';

const definition = {
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
    { name: 'Loans', description: 'Loan applications and assessments' },
    { name: 'Financial', description: 'Financial profiles, transactions, and analysis' },
    { name: 'Tenants', description: 'Companies and tenant discovery' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Platform', description: 'Superadmin and export operations' },
    { name: 'Audit', description: 'Audit logging endpoints' },
    { name: 'Health', description: 'System health checks' },
  ],
};

type GeneratedOpenApi = {
  paths?: Record<string, Record<string, Record<string, unknown>>>;
  [key: string]: unknown;
};

const generatedSpec = swaggerJSDoc({
  definition,
  apis: [
    path.resolve(__dirname, '../routes/*.ts'),
    path.resolve(__dirname, '../routes/*.js'),
  ],
}) as GeneratedOpenApi;

const mountPrefixes: Record<string, string> = {
  adminRoutes: '/api/v1/admin',
  authRoutes: '/api/v1/auth',
  companyRoutes: '/api/v1/company',
  documentRoutes: '/api/v1/kyc/documents',
  employmentRoutes: '/api/v1/employment',
  exportRoutes: '/api/v1/export',
  financialRoutes: '/api/v1/financial',
  kycRoutes: '/api/v1/kyc',
  loanAssessmentRoutes: '/api/v1/loan-assessment',
  loanRoutes: '/api/v1/loan',
  loansAliasRoutes: '/api/v1/loans',
  notificationRoutes: '/api/v1/notifications',
  portfolioRoutes: '/api/v1/portfolio',
  supercontrollerRoutes: '/api/v1/supercontroller',
  transactionRoutes: '/api/v1/transactions',
  uploadRoutes: '/api/v1/uploads',
  userRoutes: '/api/v1/users',
  slugCompatRoutes: '',
};

for (const [routeName, prefix] of Object.entries(mountPrefixes)) {
  const candidates = [
    path.resolve(__dirname, `../routes/${routeName}.ts`),
    path.resolve(__dirname, `../routes/${routeName}.js`),
  ];
  const sourceFile = candidates.find((candidate) => fs.existsSync(candidate));
  if (!sourceFile) continue;

  const source = fs.readFileSync(sourceFile, 'utf8');
  const routePattern = /(?:router|\w+Router)\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(routePattern)) {
    const method = match[1] as 'get' | 'post' | 'put' | 'patch' | 'delete';
    const routePath = match[2];
    const openApiPath = `${prefix}${routePath === '/' ? '' : routePath}`
      .replace(/\/+/g, '/')
      .replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    const paths = generatedSpec.paths ?? {};
    const operations = paths[openApiPath] ?? {};
    if (!operations[method]) {
      operations[method] = {
        tags: [routeName.replace('Routes', '')],
        summary: `${method.toUpperCase()} ${openApiPath}`,
        responses: {
          '200': { description: 'Successful response' },
          '400': { description: 'Invalid request' },
          '401': { description: 'Authentication required' },
          '403': { description: 'Insufficient permissions' },
        },
      };
    }
    paths[openApiPath] = operations;
    generatedSpec.paths = paths;
  }
}

generatedSpec.paths = generatedSpec.paths ?? {};
generatedSpec.paths['/api/v1/health'] = {
  get: {
    tags: ['Health'],
    summary: 'Health check',
    responses: { '200': { description: 'Service is running' } },
  },
  ...generatedSpec.paths['/api/v1/health'],
};

const openApiSpec = generatedSpec;

export { openApiSpec };
