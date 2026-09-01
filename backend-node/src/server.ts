import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { app } from '@/app';
import { prisma } from '@/config/database';
import { chatbotService } from '@/services/chatbotService';

const PORT = env.PORT;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  const authHeader = socket.handshake.headers.authorization as string | undefined;
  const candidate = token || authHeader?.replace(/^Bearer\s+/i, '');

  if (!candidate) {
    return next(new Error('Unauthorized'));
  }

  try {
    const decoded = jwt.verify(candidate, env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };

    socket.data.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch {
    return next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.data.user as { id: string; email: string; role: string } | undefined;
  if (!user) {
    socket.disconnect();
    return;
  }

  socket.join(`user:${user.id}`);

  socket.on('chat:join', ({ conversationId }: { conversationId?: string }) => {
    if (!conversationId) return;
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('chat:message', async ({ conversationId, content }: { conversationId?: string; content?: string }) => {
    if (!conversationId || !content || !content.trim()) {
      socket.emit('chat:error', { message: 'Message is required.' });
      return;
    }

    try {
      const result = await chatbotService.sendMessage(user.id, conversationId, content);
      const payload = {
        conversationId,
        message: result.message,
      };

      io.to(`conversation:${conversationId}`).emit('chat:message', payload);
      io.to(`user:${user.id}`).emit('chat:conversation_updated', { conversationId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      socket.emit('chat:error', { message });
    }
  });
});

const server = httpServer.listen(PORT, async () => {
  server.timeout = 120000;
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 120000;
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

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});

export default server;
