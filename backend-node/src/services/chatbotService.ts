import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';
import { statementParserService } from './statementParserService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

class LoanEligibilityCalculator {
  constructor(
    private profile: {
      avgMonthlyIncome: number;
      avgMonthlyExpense: number;
      savingsRate: number;
      debtToIncomeRatio: number;
      incomeStabilityScore: number;
      creditScoreEstimate: number;
      totalStatements: number;
    },
    private requestedAmount: number,
  ) {}

  assess(interestRate = 10.5, tenureMonths = 24) {
    const { avgMonthlyIncome, savingsRate, debtToIncomeRatio, incomeStabilityScore, totalStatements } = this.profile;

    const stabilityScore = incomeStabilityScore >= 70 ? 30 : incomeStabilityScore >= 50 ? 25 : incomeStabilityScore >= 30 ? 15 : 5;
    const savingsScore = savingsRate >= 0.30 ? 25 : savingsRate >= 0.20 ? 20 : savingsRate >= 0.10 ? 15 : savingsRate >= 0.05 ? 10 : 0;
    const dtiScore = debtToIncomeRatio <= 0.20 ? 25 : debtToIncomeRatio <= 0.40 ? 15 : debtToIncomeRatio <= 0.60 ? 5 : 0;
    const durationScore = totalStatements >= 12 ? 20 : totalStatements >= 6 ? 10 : 0;

    const monthlyRate = (interestRate / 100) / 12;
    const numerator = this.requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const monthlyEmi = denominator !== 0 ? numerator / denominator : this.requestedAmount / tenureMonths;
    const emiRatio = avgMonthlyIncome > 0 ? monthlyEmi / avgMonthlyIncome : 1;
    const affordabilityMultiplier = emiRatio <= 0.30 ? 1.0 : emiRatio <= 0.40 ? 0.7 : 0.3;

    const totalScore = (stabilityScore + savingsScore + dtiScore + durationScore) / 100 * 100;
    const finalScore = Math.min(100, totalScore * affordabilityMultiplier);

    let riskLevel: string;
    let multiplier: number;
    if (finalScore >= 80) { riskLevel = 'LOW'; multiplier = 1.0; }
    else if (finalScore >= 60) { riskLevel = 'MEDIUM'; multiplier = 0.8; }
    else if (finalScore >= 40) { riskLevel = 'HIGH'; multiplier = 0.5; }
    else { riskLevel = 'REJECTED'; multiplier = 0.0; }

    const eligibleAmount = this.requestedAmount * multiplier;
    const maxMonthlyEmi = avgMonthlyIncome * 0.30;

    return {
      eligibilityScore: Math.round(finalScore * 100) / 100,
      riskLevel,
      eligibleAmount: Math.round(eligibleAmount * 100) / 100,
      maxMonthlyEmi: Math.round(maxMonthlyEmi * 100) / 100,
      recommendedTenure: riskLevel === 'REJECTED' ? null : riskLevel === 'HIGH' ? 60 : riskLevel === 'MEDIUM' ? 36 : 24,
      monthlyEmi: Math.round(monthlyEmi * 100) / 100,
      details: {
        incomeStability: stabilityScore,
        savingsRate: savingsScore,
        debtToIncome: dtiScore,
        statementHistory: durationScore,
        emiAffordability: Math.round(affordabilityMultiplier * 100) / 100,
      },
    };
  }
}

type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  senderId?: string;
  senderRole?: string;
};

const normalizeMessages = (raw: unknown): ConversationMessage[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is ConversationMessage => Boolean(item && typeof item === 'object' && 'content' in item));
};

const resolveParticipants = (context: unknown): string[] => {
  if (typeof context !== 'object' || context === null) return [];
  const value = context as { participants?: unknown };
  if (Array.isArray(value.participants)) {
    return value.participants.filter((entry): entry is string => typeof entry === 'string');
  }
  return [];
};

export const chatbotService = {
  async listParticipants(userId: string) {
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    const targetRoles = requester?.role?.name === 'USER' ? ['ADMIN', 'REVIEWER'] : ['USER'];

    const users = await prisma.user.findMany({
      where: { isDeleted: false, role: { name: { in: targetRoles } } },
      select: {
        id: true,
        email: true,
        role: { select: { name: true } },
        profile: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return users
      .filter((user) => user.id !== userId)
      .map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName || user.email.split('@')[0],
        role: user.role.name,
      }));
  },

  async createOrOpenConversation(userId: string, participantId: string) {
    if (userId === participantId) {
      throw new AppError('You cannot start a chat with yourself.', 400);
    }

    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, email: true, role: { select: { name: true } }, profile: { select: { fullName: true } } },
    });

    if (!participant) {
      throw new AppError('Participant not found.', 404);
    }

    const existing = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const found = existing.find((entry) => {
      const participants = resolveParticipants(entry.context);
      return participants.includes(participantId);
    });

    if (found && found.sessionId) {
      return {
        conversationId: found.sessionId,
        participant: { id: participant.id, email: participant.email, fullName: participant.profile?.fullName || participant.email.split('@')[0], role: participant.role.name },
        created: false,
      };
    }

    const conversationId = `conv_${Date.now()}_${userId.slice(-6)}_${participantId.slice(-6)}`;
    const context = { participants: [userId, participantId], type: 'loan_review' };

    await prisma.$transaction([
      prisma.chatConversation.create({
        data: {
          userId,
          sessionId: conversationId,
          messages: [],
          context,
        },
      }),
      prisma.chatConversation.create({
        data: {
          userId: participantId,
          sessionId: conversationId,
          messages: [],
          context,
        },
      }),
    ]);

    return {
      conversationId,
      participant: { id: participant.id, email: participant.email, fullName: participant.profile?.fullName || participant.email.split('@')[0], role: participant.role.name },
      created: true,
    };
  },

  async listConversations(userId: string) {
    const rows = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const conversations = await Promise.all(
      rows.map(async (row) => {
        const participants = resolveParticipants(row.context);
        const otherUserId = participants.find((id) => id !== userId) || row.sessionId?.split('_').slice(-1)[0] || null;
        const otherUser = otherUserId
          ? await prisma.user.findUnique({
              where: { id: otherUserId },
              select: {
                id: true,
                email: true,
                role: { select: { name: true } },
                profile: { select: { fullName: true } },
              },
            })
          : null;

        const messages = normalizeMessages(row.messages);
        const lastMessage = [...messages].reverse().find(Boolean);

        return {
          conversationId: row.sessionId || row.id,
          participant: otherUser
            ? {
                id: otherUser.id,
                email: otherUser.email,
                fullName: otherUser.profile?.fullName || otherUser.email.split('@')[0],
                role: otherUser.role.name,
              }
            : null,
          lastMessage: lastMessage?.content || 'No messages yet',
          updatedAt: row.updatedAt,
        };
      })
    );

    return conversations.filter((conversation) => conversation.participant !== null);
  },

  async getMessagesForConversation(userId: string, conversationId: string) {
    const row = await prisma.chatConversation.findFirst({
      where: { userId, sessionId: conversationId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!row) {
      throw new AppError('Conversation not found.', 404);
    }

    return {
      conversationId,
      messages: normalizeMessages(row.messages),
    };
  },

  async sendMessage(userId: string, conversationId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new AppError('Message is required.', 400);
    }

    const rows = await prisma.chatConversation.findMany({
      where: { sessionId: conversationId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!rows.length) {
      throw new AppError('Conversation not found.', 404);
    }

    const isParticipant = rows.some((row) => row.userId === userId);
    if (!isParticipant) {
      throw new AppError('You are not part of this conversation.', 403);
    }

    const timestamp = new Date().toISOString();
    const message: ConversationMessage = {
      role: 'user',
      content: trimmed,
      timestamp,
      senderId: userId,
    };

    await prisma.$transaction(
      rows.map((row) => {
        const messages = normalizeMessages(row.messages);
        return prisma.chatConversation.update({
          where: { id: row.id },
          data: {
            messages: [...messages, message],
            updatedAt: new Date(),
          },
        });
      })
    );

    return {
      conversationId,
      message,
      messages: rows.flatMap((row) => normalizeMessages(row.messages)).concat(message),
    };
  },

  async processQuery(userId: string, message: string, sessionId: string): Promise<{
    intent: string;
    extractedEntities: Record<string, unknown>;
    answer: string;
  }> {
    const q = message.toLowerCase().trim();
    const startTime = Date.now();

    const entities = this.extractEntities(message);
    const intent = this.classifyIntent(q);

    let answer = '';

    try {
      switch (intent) {
        case 'LOAN_ELIGIBILITY': {
          const profile = await this.getFinancialProfile(userId);
          const amount = (entities.amount as number) || 500000;
          const tenure = (entities.tenureMonths as number) || 24;
          const calc = new LoanEligibilityCalculator(profile, amount);
          const result = calc.assess(10.5, tenure);

          answer = `Loan Eligibility Assessment:
• Requested Amount: ₹${result.eligibleAmount.toLocaleString('en-IN')}
• Eligible Amount: ₹${Number(result.eligibleAmount).toLocaleString('en-IN')}
• Eligibility Score: ${result.eligibilityScore}/100
• Risk Level: ${result.riskLevel}
• Monthly EMI (${tenure}m): ₹${result.monthlyEmi.toLocaleString('en-IN')}
• Max Affordable EMI: ₹${result.maxMonthlyEmi.toLocaleString('en-IN')}
${result.riskLevel === 'REJECTED' ? 'Unfortunately, you are not eligible for this loan amount based on your current profile.' : `Recommended tenure: ${result.recommendedTenure} months`}`;
          break;
        }

        case 'INCOME_ANALYSIS': {
          const profile = await this.getFinancialProfile(userId);
          answer = `Income Analysis:
• Average Monthly Income: ₹${Number(profile.avgMonthlyIncome).toLocaleString('en-IN')}
• Average Monthly Expense: ₹${Number(profile.avgMonthlyExpense).toLocaleString('en-IN')}
• Total Income (all time): ₹${Number(profile.totalIncome).toLocaleString('en-IN')}
• Total Expenses: ₹${Number(profile.totalExpense).toLocaleString('en-IN')}
• Savings Rate: ${(Number(profile.savingsRate) * 100).toFixed(1)}%`;
          break;
        }

        case 'SPENDING_PATTERN': {
          const expenses = await prisma.transaction.groupBy({
            by: ['transactionType'],
            where: { userId, category: 'EXPENSE' },
            _sum: { debit: true },
            _count: true,
            orderBy: { _sum: { debit: 'desc' } },
          });

          if (expenses.length === 0) {
            answer = 'No expense transactions found. Upload a bank statement to see your spending patterns.';
          } else {
            const total = expenses.reduce((s, e) => s + Number(e._sum.debit || 0), 0);
            const breakdown = expenses.map(e =>
              `${e.transactionType}: ₹${Number(e._sum.debit || 0).toLocaleString('en-IN')} (${(Number(e._sum.debit || 0) / total * 100).toFixed(1)}%)`
            ).join('\n• ');
            answer = `Spending Breakdown (Total: ₹${total.toLocaleString('en-IN')}):\n• ${breakdown}`;
          }
          break;
        }

        case 'SAVINGS_ANALYSIS': {
          const profile = await this.getFinancialProfile(userId);
          answer = `Savings Analysis:
• Total Savings: ₹${Number(profile.totalSavings).toLocaleString('en-IN')}
• Savings Rate: ${(Number(profile.savingsRate) * 100).toFixed(1)}% of income
• ${Number(profile.savingsRate) >= 0.3 ? 'Excellent savings habit!' : Number(profile.savingsRate) >= 0.15 ? 'Good savings rate. Consider increasing it.' : 'Low savings rate. Try to save at least 20% of income.'}`;
          break;
        }

        case 'TRANSACTION_LIST': {
          const txs = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { transactionDate: 'desc' },
            take: 10,
          });

          if (txs.length === 0) {
            answer = 'No transactions found. Upload a bank statement to see your transactions.';
          } else {
            const lines = txs.map(t =>
              `${t.transactionDate.toISOString().split('T')[0]} | ${t.description?.substring(0, 40).padEnd(40)} | ${t.credit ? `+₹${Number(t.credit).toLocaleString('en-IN')}` : t.debit ? `-₹${Number(t.debit).toLocaleString('en-IN')}` : ''}`
            ).join('\n');
            answer = `Recent Transactions (last 10):\n${lines}`;
          }
          break;
        }

        case 'FINANCIAL_HEALTH': {
          const profile = await this.getFinancialProfile(userId);
          let health = 'Poor';
          if (Number(profile.creditScoreEstimate) >= 750) health = 'Excellent';
          else if (Number(profile.creditScoreEstimate) >= 650) health = 'Good';
          else if (Number(profile.creditScoreEstimate) >= 500) health = 'Fair';

          answer = `Financial Health Summary:
• Estimated Credit Score: ${profile.creditScoreEstimate}/900 (${health})
• Income Stability: ${Number(profile.incomeStabilityScore).toFixed(0)}/100
• Debt-to-Income Ratio: ${(Number(profile.debtToIncomeRatio) * 100).toFixed(1)}%
• Statement History: ${profile.totalStatements} statement(s)
• ${Number(profile.incomeStabilityScore) >= 60 ? 'Your income is stable.' : 'Your income shows some variability.'}`;
          break;
        }

        case 'DEBT_ANALYSIS': {
          const profile = await this.getFinancialProfile(userId);
          const dti = Number(profile.debtToIncomeRatio);
          let assessment = dti <= 0.20 ? 'Low debt burden — healthy financial position.'
            : dti <= 0.40 ? 'Moderate debt — manageable but monitor closely.'
            : dti <= 0.60 ? 'High debt — consider reducing expenses.'
            : 'Critical debt level — seek financial counseling.';

          answer = `Debt-to-Income Analysis:
• DTI Ratio: ${(dti * 100).toFixed(1)}%
• ${assessment}
• Recommended max DTI: < 40%`;
          break;
        }

        case 'COMPARISON': {
          const profile = await this.getFinancialProfile(userId);
          const income = Number(profile.avgMonthlyIncome);
          const expense = Number(profile.avgMonthlyExpense);
          const diff = income - expense;
          answer = `Income vs Expenses (Monthly):
• Income: ₹${income.toLocaleString('en-IN')}
• Expenses: ₹${expense.toLocaleString('en-IN')}
• Difference: ₹${diff.toLocaleString('en-IN')}
• ${diff > 0 ? `You save ₹${diff.toLocaleString('en-IN')} per month (${(diff / income * 100).toFixed(1)}% of income).` : 'Your expenses exceed income. Consider reducing spending.'}`;
          break;
        }

        case 'TREND_ANALYSIS': {
          const monthlyData = await prisma.$queryRawUnsafe(
        `SELECT
          TO_CHAR(DATE_TRUNC('month', t.transaction_date)::DATE, 'YYYY-MM') AS month,
          COALESCE(SUM(CASE WHEN t.credit IS NOT NULL THEN t.credit ELSE 0 END), 0) AS income,
          COALESCE(SUM(CASE WHEN t.debit IS NOT NULL THEN t.debit ELSE 0 END), 0) AS expense
        FROM "auth"."transactions" t
        WHERE t.user_id = $1
        GROUP BY DATE_TRUNC('month', t.transaction_date)
        ORDER BY month`,
        userId,
      ) as Array<{ month: string; income: number; expense: number }>;

          if (!monthlyData || monthlyData.length === 0) {
            answer = 'No transaction data available for trend analysis.';
          } else {
            const lines = monthlyData.map(m =>
              `${m.month}: Income ₹${Number(m.income).toLocaleString('en-IN')} | Expense ₹${Number(m.expense).toLocaleString('en-IN')}`
            ).join('\n');
            answer = `Monthly Trends:\n${lines}`;
          }
          break;
        }

        default: {
          answer = `I can help you with:
• Loan eligibility: "How much loan can I get for ₹5,00,000?"
• Income analysis: "What's my average monthly income?"
• Spending patterns: "Where do I spend the most?"
• Savings analysis: "How much do I save monthly?"
• Financial health: "What's my credit score?"
• Debt analysis: "What's my debt-to-income ratio?"
• Transactions: "Show my recent transactions"
• Trends: "Show my income trend"
• Comparison: "Compare my income vs expenses"`;
        }
      }

      const processingTime = Date.now() - startTime;

      await prisma.nluQuery.create({
        data: {
          userId,
          rawQuestion: message,
          intent,
          extractedEntities: entities,
          response: answer,
          processingTimeMs: processingTime,
        },
      });

      await this.updateConversation(userId, sessionId, message, answer);

      return { intent, extractedEntities: entities as Record<string, unknown>, answer };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await prisma.nluQuery.create({
        data: {
          userId,
          rawQuestion: message,
          intent: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          processingTimeMs: processingTime,
        },
      });

      logger.error({ err: error, userId, message }, 'Chatbot query failed');
      throw new AppError('Failed to process query. Please try again.', 500);
    }
  },

  classifyIntent(q: string): string {
    if (/(?:loan|eligible|borrow|lend|credit|approval|qualify)/.test(q) && /(?:how much|amount|rs\.?|rupees)/.test(q)) {
      return 'LOAN_ELIGIBILITY';
    }
    if (/(?:income|salary|earn)/.test(q) && /(?:average|monthly|total|how much)/.test(q)) {
      return 'INCOME_ANALYSIS';
    }
    if (/(?:spend|expense|cost|bill|payment|purchase|where|pattern)/.test(q)) {
      return 'SPENDING_PATTERN';
    }
    if (/(?:saving|saved|save|leftover|surplus)/.test(q)) {
      return 'SAVINGS_ANALYSIS';
    }
    if (/(?:list|show|all|display|transactions|history)/.test(q)) {
      return 'TRANSACTION_LIST';
    }
    if (/(?:credit score|health|stability|rating)/.test(q)) {
      return 'FINANCIAL_HEALTH';
    }
    if (/(?:debt|dti|ratio|leverage)/.test(q)) {
      return 'DEBT_ANALYSIS';
    }
    if (/(?:compare|comparison|vs|versus|difference|against)/.test(q)) {
      return 'COMPARISON';
    }
    if (/(?:trend|growth|decline|change|over time|month|weekly)/.test(q)) {
      return 'TREND_ANALYSIS';
    }
    return 'UNRECOGNIZED';
  },

  extractEntities(text: string): Record<string, unknown> {
    const entities: Record<string, unknown> = {};

    const amountPatterns = [
      /rs\.?\s*([\d,]+)/i,
      /rupees?\s*([\d,]+)/i,
      /₹\s*([\d,]+)/i,
      /(\d+)\s*(?:lakh|lac)/i,
      /(\d+)\s*(?:crore)/i,
    ];
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        let val = parseFloat(match[1].replace(/,/g, ''));
        const lower = text.toLowerCase();
        if (lower.includes('lakh') || lower.includes('lac')) val *= 100000;
        else if (lower.includes('crore')) val *= 10000000;
        entities.amount = val;
        break;
      }
    }

    const tenurePatterns = [
      { re: /(\d+)\s*months?/, mult: 1 },
      { re: /(\d+)\s*years?/, mult: 12 },
    ];
    for (const { re, mult } of tenurePatterns) {
      const match = text.match(re);
      if (match) {
        entities.tenureMonths = parseInt(match[1]) * mult;
        break;
      }
    }

    return entities;
  },

  async getFinancialProfile(userId: string) {
    let profile = await prisma.financialProfile.findUnique({ where: { userId } });

    if (!profile) {
      await statementParserService.recalculateFinancialProfile(userId);
      profile = await prisma.financialProfile.findUnique({ where: { userId } });
    }

    if (!profile) {
      throw new AppError('No financial data found. Please upload a bank statement first.', 404);
    }

    return {
      avgMonthlyIncome: Number(profile.avgMonthlyIncome || 0),
      avgMonthlyExpense: Number(profile.avgMonthlyExpense || 0),
      savingsRate: Number(profile.savingsRate || 0),
      debtToIncomeRatio: Number(profile.debtToIncomeRatio || 0),
      incomeStabilityScore: Number(profile.incomeStabilityScore || 0),
      creditScoreEstimate: Number(profile.creditScoreEstimate || 600),
      totalStatements: profile.totalStatements,
      totalIncome: Number(profile.totalIncome || 0),
      totalExpense: Number(profile.totalExpense || 0),
      totalSavings: Number(profile.totalSavings || 0),
    };
  },

  async updateConversation(userId: string, sessionId: string, userMessage: string, botResponse: string): Promise<void> {
    const existing = await prisma.chatConversation.findFirst({
      where: { userId, sessionId },
      orderBy: { updatedAt: 'desc' },
    });

    const msgTimestamp = new Date().toISOString();
    const userMsg: ChatMessage = { role: 'user', content: userMessage, timestamp: msgTimestamp };
    const botMsg: ChatMessage = { role: 'assistant', content: botResponse, timestamp: new Date().toISOString() };

    if (existing) {
      const messages = (existing.messages as ChatMessage[]) || [];
      messages.push(userMsg, botMsg);
      if (messages.length > 100) messages.splice(0, messages.length - 100);

      await prisma.chatConversation.update({
        where: { id: existing.id },
        data: { messages, updatedAt: new Date() },
      });
    } else {
      await prisma.chatConversation.create({
        data: {
          userId,
          sessionId,
          messages: [userMsg, botMsg],
        },
      });
    }
  },

  async getConversationHistory(userId: string, sessionId: string) {
    return prisma.chatConversation.findFirst({
      where: { userId, sessionId },
      orderBy: { updatedAt: 'desc' },
    });
  },
};
