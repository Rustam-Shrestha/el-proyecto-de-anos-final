import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import { z } from 'zod';
import {
  askQuestion,
  getConversationHistory,
  listChatParticipants,
  listMyConversations,
  createOrOpenConversation,
  getChatMessages,
  sendChatMessage,
} from '@/controllers/chatbotController';

const chatbotRouter = Router();

export const askSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(2000),
    sessionId: z.string().optional(),
  }),
});

export const historySchema = z.object({
  params: z.object({ sessionId: z.string() }),
});

export const createConversationSchema = z.object({
  body: z.object({
    participantId: z.string().min(1, 'Participant is required'),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content is required').max(5000),
  }),
  params: z.object({
    conversationId: z.string().min(1, 'Conversation id is required'),
  }),
});

export const chatMessageListSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, 'Conversation id is required'),
  }),
});

chatbotRouter.post(
  '/ask',
  authenticate,
  validate(askSchema),
  askQuestion,
);

chatbotRouter.get(
  '/history/:sessionId',
  authenticate,
  validate(historySchema),
  getConversationHistory,
);

chatbotRouter.get('/participants', authenticate, listChatParticipants);
chatbotRouter.get('/conversations', authenticate, listMyConversations);
chatbotRouter.post(
  '/conversations',
  authenticate,
  validate(createConversationSchema),
  createOrOpenConversation,
);
chatbotRouter.get(
  '/conversations/:conversationId/messages',
  authenticate,
  validate(chatMessageListSchema),
  getChatMessages,
);
chatbotRouter.post(
  '/conversations/:conversationId/messages',
  authenticate,
  validate(sendMessageSchema),
  sendChatMessage,
);

export default chatbotRouter;
