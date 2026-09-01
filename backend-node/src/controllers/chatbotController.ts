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

export const listChatParticipants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const participants = await chatbotService.listParticipants(user.id);
    res.json(apiResponse.success('Participants retrieved', participants));
  } catch (error) {
    next(error);
  }
};

export const listMyConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const conversations = await chatbotService.listConversations(user.id);
    res.json(apiResponse.success('Conversations retrieved', conversations));
  } catch (error) {
    next(error);
  }
};

export const createOrOpenConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { participantId } = req.body as { participantId: string };
    const conversation = await chatbotService.createOrOpenConversation(user.id, participantId);
    res.status(201).json(apiResponse.success('Conversation ready', conversation));
  } catch (error) {
    next(error);
  }
};

export const getChatMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { conversationId } = req.params as { conversationId: string };
    const payload = await chatbotService.getMessagesForConversation(user.id, conversationId);
    res.json(apiResponse.success('Messages retrieved', payload));
  } catch (error) {
    next(error);
  }
};

export const sendChatMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json(apiResponse.error('Authentication required', 401));
      return;
    }

    const { conversationId } = req.params as { conversationId: string };
    const { content } = req.body as { content: string };
    const payload = await chatbotService.sendMessage(user.id, conversationId, content);
    res.status(201).json(apiResponse.success('Message sent', payload));
  } catch (error) {
    next(error);
  }
};
