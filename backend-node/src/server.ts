import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { app } from '@/app';
import { prisma } from '@/config/database';

const PORT = env.PORT;

const server = app.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`API docs available at http://localhost:${PORT}/docs`);
  logger.info(`Environment: ${env.NODE_ENV}`);

  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Server closed');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});

export default server;
