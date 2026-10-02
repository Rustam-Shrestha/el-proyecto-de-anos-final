import type { Request, Response, NextFunction } from 'express';
import { chatbotService } from '@/services/chatbotService';
import { apiResponse } from '@/utils/apiResponse';

export const askQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { message, sessionId = `session_${user.id}_${Date.now()}` } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json(apiResponse.error('Message is required', 400));
      return;
    }

    const result = await chatbotService.processQuery(user.id, message, sessionId);

    res.json(apiResponse.success('Query processed', {
      intent: result.intent,
      extractedEntities: result.extractedEntities,
      answer: result.answer,
      sessionId,
    }));
  } catch (error) {
    next(error);
  }
};

export const getConversationHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { sessionId } = req.params as { sessionId: string };
    const conversation = await chatbotService.getConversationHistory(user.id, sessionId);

    if (!conversation) {
      res.status(404).json(apiResponse.error('Conversation not found', 404));
      return;
    }

    res.json(apiResponse.success('Conversation history retrieved', conversation));
  } catch (error) {
    next(error);
  }
};
