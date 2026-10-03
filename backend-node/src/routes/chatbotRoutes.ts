import { Router } from 'express';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/requestValidation';
import { z } from 'zod';
import {
  askQuestion,
  getConversationHistory,
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

export default chatbotRouter;
