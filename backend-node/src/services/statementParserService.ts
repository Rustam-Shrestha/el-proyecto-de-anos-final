import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/AppError';

export interface ParsedTransaction {
  transactionDate: Date;
  description: string;
  debit?: number;
  credit?: number;
  balance?: number;
}

export interface ParsedStatement {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  statementFromDate: Date;
  statementToDate: Date;
  openingBalance: number;
  closingBalance: number;
  transactions: ParsedTransaction[];
}

const BANK_PATTERNS = {
  accountHolder: /(?:Account\s*Holder|Name|Customer\s*Name)[:\s]+(.+)/i,
  accountNumber: /(?:Account\s*Number|A\/C|Acct)[:\s#]*(\d+)/i,
  bankName: /(?:Bank\s*Name|Bank)[:\s]+(.+)/i,
  fromDate: /(?:From|Period\s*From|Statement\s*From)[:\s]+(.+)/i,
  toDate: /(?:To|Period\s*To|Statement\s*To)[:\s]+(.+)/i,
  openingBalance: /(?:Opening\s*Balance|Open\s*Bal|B\/F)[:\s]+([\d,]+\.?\d*)/i,
  closingBalance: /(?:Closing\s*Balance|Close\s*Bal|C\/F)[:\s]+([\d,]+\.?\d*)/i,
};

const CATEGORY_RULES: Array<{ pattern: RegExp; category: string; type: string }> = [
  { pattern: /salary|wage|payroll|income/i, category: 'INCOME', type: 'SALARY' },
  { pattern: /interest|dividend/i, category: 'INCOME', type: 'INTEREST' },
  { pattern: /bonus|commission/i, category: 'INCOME', type: 'BONUS' },
  { pattern: /rent|lease/i, category: 'EXPENSE', type: 'RENT' },
  { pattern: /electricity|water|gas|utility|bill/i, category: 'EXPENSE', type: 'UTILITY' },
  { pattern: /insurance|premium/i, category: 'EXPENSE', type: 'INSURANCE' },
  { pattern: /food|restaurant|cafe|grocery/i, category: 'EXPENSE', type: 'FOOD' },
  { pattern: /travel|flight|hotel|transport/i, category: 'EXPENSE', type: 'TRAVEL' },
  { pattern: /shopping|amazon|flipkart|mall/i, category: 'EXPENSE', type: 'SHOPPING' },
  { pattern: /transfer|remit|fund\s*transfer/i, category: 'EXPENSE', type: 'TRANSFER' },
  { pattern: /investment|mutual|stock|fd|deposit/i, category: 'INVESTMENT', type: 'INVESTMENT' },
  { pattern: /saving|savings/i, category: 'SAVINGS', type: 'SAVINGS' },
];

function classifyTransaction(description: string): { category: string; transactionType: string } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, transactionType: rule.type };
    }
  }
  if (description.toLowerCase().includes('credit') || description.toLowerCase().includes('deposit')) {
    return { category: 'INCOME', transactionType: 'OTHER_INCOME' };
  }
  if (description.toLowerCase().includes('debit') || description.toLowerCase().includes('withdrawal')) {
    return { category: 'EXPENSE', transactionType: 'OTHER_EXPENSE' };
  }
  return { category: 'UNKNOWN', transactionType: 'UNKNOWN' };
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseDate(value: string): Date | null {
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;

  const parts = value.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (parts) {
    const [, m, d2, y] = parts;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    return new Date(year, parseInt(m) - 1, parseInt(d2));
  }
  return null;
}

export const statementParserService = {
  async parseStatementText(text: string): Promise<ParsedStatement> {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const statement: ParsedStatement = {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      statementFromDate: new Date(),
      statementToDate: new Date(),
      openingBalance: 0,
      closingBalance: 0,
      transactions: [],
    };

    for (const line of lines) {
      for (const [key, pattern] of Object.entries(BANK_PATTERNS)) {
        const match = line.match(pattern);
        if (match) {
          const val = match[1].trim();
          switch (key) {
            case 'accountHolder': statement.accountHolderName = val; break;
            case 'accountNumber': statement.accountNumber = val.replace(/\D/g, ''); break;
            case 'bankName': statement.bankName = val; break;
            case 'fromDate': { const d = parseDate(val); if (d) statement.statementFromDate = d; } break;
            case 'toDate': { const d = parseDate(val); if (d) statement.statementToDate = d; } break;
            case 'openingBalance': statement.openingBalance = parseAmount(val); break;
            case 'closingBalance': statement.closingBalance = parseAmount(val); break;
          }
        }
      }
    }

    const txPattern = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s+(.+?)\s+([\d,]+\.?\d*)?\s+([\d,]+\.?\d*)?\s+([\d,]+\.?\d*)?/;
    for (const line of lines) {
      const match = line.match(txPattern);
      if (match) {
        const date = parseDate(match[1]);
        const desc = match[2].trim();
        const debitVal = match[4] ? parseAmount(match[4]) : undefined;
        const creditVal = match[3] ? parseAmount(match[3]) : undefined;
        const balanceVal = match[5] ? parseAmount(match[5]) : undefined;

        if (date) {
          statement.transactions.push({
            transactionDate: date,
            description: desc,
            debit: debitVal,
            credit: creditVal,
            balance: balanceVal,
          });
        }
      }
    }

    return statement;
  },

  async saveParsedStatement(userId: string, parsed: ParsedStatement): Promise<string> {
    const statement = await prisma.bankStatement.create({
      data: {
        userId,
        bankName: parsed.bankName,
        accountNumber: parsed.accountNumber,
        accountHolderName: parsed.accountHolderName,
        statementFromDate: parsed.statementFromDate,
        statementToDate: parsed.statementToDate,
        openingBalance: parsed.openingBalance,
        closingBalance: parsed.closingBalance,
        parsingStatus: 'SUCCESS',
      },
    });

    const txData = parsed.transactions.map(tx => {
      const { category, transactionType } = classifyTransaction(tx.description);
      return {
        bankStatementId: statement.id,
        userId,
        transactionDate: tx.transactionDate,
        description: tx.description,
        debit: tx.debit ?? null,
        credit: tx.credit ?? null,
        balance: tx.balance ?? null,
        category,
        transactionType,
      };
    });

    if (txData.length > 0) {
      await prisma.transaction.createMany({ data: txData });
    }

    logger.info({ userId, statementId: statement.id, txCount: txData.length }, 'Bank statement parsed and saved');

    return statement.id;
  },

  async recalculateFinancialProfile(userId: string): Promise<void> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
    });

    if (transactions.length === 0) return;

    const incomeTx = transactions.filter(t => t.category === 'INCOME');
    const expenseTx = transactions.filter(t => t.category === 'EXPENSE');

    const totalIncome = incomeTx.reduce((s, t) => s + (Number(t.credit) || 0), 0);
    const totalExpense = expenseTx.reduce((s, t) => s + (Number(t.debit) || 0), 0);
    const totalSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? totalSavings / totalIncome : 0;

    const dates = transactions.map(t => t.transactionDate).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
    const dateRangeStart = dates[0];
    const dateRangeEnd = dates[dates.length - 1];

    const monthlyMap = new Map<string, { income: number; expense: number }>();
    for (const tx of transactions) {
      const key = `${tx.transactionDate.getFullYear()}-${String(tx.transactionDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap.has(key)) monthlyMap.set(key, { income: 0, expense: 0 });
      const m = monthlyMap.get(key)!;
      if (tx.category === 'INCOME') m.income += Number(tx.credit) || 0;
      if (tx.category === 'EXPENSE') m.expense += Number(tx.debit) || 0;
    }

    const months = Array.from(monthlyMap.values());
    const avgMonthlyIncome = months.length > 0 ? months.reduce((s, m) => s + m.income, 0) / months.length : 0;
    const avgMonthlyExpense = months.length > 0 ? months.reduce((s, m) => s + m.expense, 0) / months.length : 0;

    const incomes = months.filter(m => m.income > 0).map(m => m.income);
    let incomeStabilityScore = 50;
    if (incomes.length >= 3) {
      const mean = incomes.reduce((s, v) => s + v, 0) / incomes.length;
      const variance = incomes.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / incomes.length;
      const cv = Math.sqrt(variance) / mean;
      incomeStabilityScore = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
    }

    const { count: activeLoans } = await prisma.loanAccount.aggregate({
      where: { userId, isActive: true },
      _count: true,
    });

    const totalDebt = activeLoans > 0 ? totalExpense * 0.3 : 0;
    const dtiRatio = totalIncome > 0 ? (totalExpense + totalDebt) / totalIncome : 1;

    const totalStatements = await prisma.bankStatement.count({ where: { userId } });

    let creditScore = 600;
    if (savingsRate > 0.3) creditScore += 100;
    else if (savingsRate > 0.15) creditScore += 50;
    else if (savingsRate > 0) creditScore += 25;
    if (incomeStabilityScore > 70) creditScore += 50;
    else if (incomeStabilityScore > 50) creditScore += 25;
    if (dtiRatio < 0.3) creditScore += 50;
    if (totalStatements >= 6) creditScore += 50;
    else if (totalStatements >= 3) creditScore += 25;
    creditScore = Math.min(900, Math.max(300, creditScore));

    await prisma.financialProfile.upsert({
      where: { userId },
      create: {
        userId,
        totalStatements,
        dateRangeStart,
        dateRangeEnd,
        avgMonthlyIncome,
        avgMonthlyExpense,
        totalIncome,
        totalExpense,
        totalSavings,
        savingsRate,
        debtToIncomeRatio: dtiRatio,
        incomeStabilityScore,
        creditScoreEstimate: creditScore,
      },
      update: {
        totalStatements,
        dateRangeStart,
        dateRangeEnd,
        avgMonthlyIncome,
        avgMonthlyExpense,
        totalIncome,
        totalExpense,
        totalSavings,
        savingsRate,
        debtToIncomeRatio: dtiRatio,
        incomeStabilityScore,
        creditScoreEstimate: creditScore,
        lastUpdated: new Date(),
      },
    });

    logger.info({ userId }, 'Financial profile recalculated');
  },
};
