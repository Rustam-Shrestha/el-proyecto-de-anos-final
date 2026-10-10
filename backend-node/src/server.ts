import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { app } from '@/app';
import { prisma } from '@/config/database';
import { auditService } from '@/services/auditService';
import { chatbotService } from '@/services/chatbotService';
import { setIO } from '@/config/socket';
import { socketCache } from '@/services/cache';
// Static import, not await import(): the build emits CommonJS, where a dynamic
// import resolves through ESM rules and would need an explicit .js extension
// that tsc-alias does not add — which crashed OCR job reset at boot.
import { resetStaleOcrJobs } from '@/jobs/ocrProcessingJob';

const PORT = env.PORT;
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});
setIO(io);

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  const authHeader = socket.handshake.headers.authorization as string | undefined;
  const candidate = token || authHeader?.replace(/^Bearer\s+/i, '');

  if (!candidate) {
    return next(new Error('Unauthorized'));
  }

  // Fast-path: check socket auth cache to bypass repeated crypto verification
  try {
    const cachedUser = await socketCache.getCachedTokenPayload(candidate);
    if (cachedUser) {
      socket.data.user = cachedUser;
      return next();
    }
  } catch {
    // If cache fails, fall through to JWT verification
  }

  try {
    const decoded = jwt.verify(candidate, env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };

    const userPayload = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    socket.data.user = userPayload;

    // Cache verified token payload with 120s TTL
    void socketCache.setCachedTokenPayload(candidate, userPayload, 120);

    return next();
  } catch {
    return next(new Error('Invalid token'));
  }
});

io.on('connection', async (socket) => {
  const user = socket.data.user as { id: string; email: string; role: string } | undefined;
  if (!user) {
    socket.disconnect();
    return;
  }

  socket.join(`user:${user.id}`);

  // Register active socket connection and user presence in cache
  await socketCache.registerConnection(user.id, socket.id, {
    email: user.email,
    role: user.role,
  });

  // Push cached unread notification count on connection if available
  try {
    const cachedUnread = await socketCache.getCachedUnreadCount(user.id);
    if (cachedUnread !== null) {
      socket.emit('notification:unread_count', { unreadCount: cachedUnread });
    }
  } catch {
    /* ignore */
  }

  socket.on('chat:join', async ({ conversationId }: { conversationId?: string }) => {
    if (!conversationId) return;
    socket.join(`conversation:${conversationId}`);

    // Fast-path delivery of cached recent conversation history
    try {
      let recent = await socketCache.getRecentMessages(conversationId);
      if (!recent) {
        // Warm cache from database if missing
        const conv = await chatbotService.getMessagesForConversation(user.id, conversationId).catch(() => null);
        if (conv && conv.messages) {
          recent = conv.messages.slice(-50);
          await socketCache.setRecentMessages(conversationId, recent, 1800);
        }
      }

      if (recent && recent.length > 0) {
        socket.emit('chat:cached_history', {
          conversationId,
          messages: recent,
        });
      }
    } catch (err) {
      logger.warn({ err, conversationId }, 'Failed to provide cached chat history');
    }
  });

  socket.on('chat:message', async ({ conversationId, content }: { conversationId?: string; content?: string }) => {
    if (!conversationId || !content || !content.trim()) {
      socket.emit('chat:error', { message: 'Message is required.' });
      return;
    }

    // Socket-level sliding-window rate limit (max 60 messages / minute)
    const rateCheck = await socketCache.checkRateLimit(user.id, 'chat:message', 60, 60);
    if (!rateCheck.allowed) {
      socket.emit('chat:error', {
        message: 'Rate limit exceeded. Please wait a moment before sending more messages.',
      });
      return;
    }

    try {
      const result = await chatbotService.sendMessage(user.id, conversationId, content);
      const payload = {
        conversationId,
        message: result.message,
      };

      // Append to socket cache history immediately
      await socketCache.appendMessage(conversationId, result.message);

      io.to(`conversation:${conversationId}`).emit('chat:message', payload);
      io.to(`user:${user.id}`).emit('chat:conversation_updated', { conversationId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      socket.emit('chat:error', { message });
    }
  });

  socket.on('disconnect', async () => {
    await socketCache.unregisterConnection(user.id, socket.id);
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

  // OCR hygiene: recover jobs stuck in PROCESSING by a previous crashed run.
  // Best-effort — never blocks startup.
  try {
    await resetStaleOcrJobs();
  } catch (error) {
    logger.warn({ err: error }, 'Skipping stale OCR job reset');
  }

  // Audit retention trim: audit_logs grows on every mutating request, so prune
  // rows older than AUDIT_LOG_RETENTION_DAYS (default 180). Best-effort.
  try {
    const retentionDays = Number(process.env.AUDIT_LOG_RETENTION_DAYS ?? 180) || 180;
    await auditService.trimOldLogs(retentionDays);
  } catch (error) {
    logger.warn({ err: error }, 'Skipping audit log retention trim');
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
