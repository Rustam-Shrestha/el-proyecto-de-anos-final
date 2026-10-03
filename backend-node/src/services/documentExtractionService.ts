import { logger } from '@/config/logger';

interface OcrResult {
  fullText: string;
  textLines: string[];
  confidence: number;
  structuredData?: Record<string, unknown>;
}

interface NormalizedOutput {
  documentType: string;
  rawLines: string[];
  cleanedText: string;
  keywordMatches: Record<string, boolean>;
}

interface ExtractionResult {
  documentType: string;
  extractedData: Record<string, string | number | null>;
  confidence: Record<string, number>;
}

interface ComparisonField {
  matched: boolean;
  declared: string | number | null;
  extracted: string | number | null;
  differencePercent?: number;
  isRecent?: boolean;
  similarity?: number;
  confidence: number;
}

interface ComparisonResult {
  salaryMatch?: ComparisonField;
  employerMatch?: ComparisonField;
  dateMatch?: ComparisonField;
  nameMatch?: ComparisonField;
  [key: string]: ComparisonField | undefined;
}

interface FlagDetail {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
}

interface FlagResult {
  flagList: string[];
  count: number;
  details: FlagDetail[];
}

const DOCUMENT_KEYWORDS: Record<string, string[]> = {
  SALARY_SLIP: ['salary', 'gross', 'net', 'employer', 'employee', 'date', 'month', 'total', 'deduction'],
  BANK_STATEMENT: ['account', 'balance', 'deposit', 'withdrawal', 'date', 'transaction', 'bank', 'credit'],
  INCOME_CERT: ['income', 'certified', 'authority', 'date', 'certificate', 'amount', 'annual'],
  BUSINESS_REG: ['business', 'registration', 'company', 'firm', 'register', 'owner', 'proprietor'],
  PENSION_LETTER: ['pension', 'retirement', 'benefit', 'monthly', 'allowance', 'date'],
  PAN: ['pan', 'permanent', 'account', 'number', 'tax'],
  OTHER: [],
};

function cleanText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeNepaliNumber(text: string): string {
  const nepaliDigits: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return text.replace(/[०१२३४५६७८९]/g, (d) => nepaliDigits[d] || d);
}

function cleanNumberValue(text: string): string {
  return text
    .replace(/[RsrR,\s\/-]+/g, '')
    .replace(/[()]/g, '')
    .trim();
}

function extractKeywords(text: string, documentType: string): Record<string, boolean> {
  const keywords = DOCUMENT_KEYWORDS[documentType] || [];
  const matches: Record<string, boolean> = {};
  keywords.forEach((keyword) => {
    matches[keyword] = text.includes(keyword);
  });
  return matches;
}

function parseDateString(dateStr: string): string | null {
  const cleaned = dateStr.replace(/[^\d\/\-\.]/g, ' ').trim();

  const isoMatch = cleaned.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const ddMmMatch = cleaned.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddMmMatch) {
    const [, d, m, y] = ddMmMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const ddMmShort = cleaned.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (ddMmShort) {
    const [, d, m, y] = ddMmShort;
    const fullYear = y.length === 2 ? `20${y}` : y;
    return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const allMonths = [...monthNames, ...monthAbbr];

  const monthRegex = new RegExp(`(${allMonths.join('|')})\\s*(\\d{1,2})[,\\s]+(\\d{4})`, 'i');
  const monthMatch = dateStr.match(monthRegex);
  if (monthMatch) {
    const monthStr = monthMatch[1].toLowerCase().substring(0, 3);
    const monthIndex = monthAbbr.indexOf(monthStr);
    if (monthIndex >= 0) {
      return `${monthMatch[3]}-${String(monthIndex + 1).padStart(2, '0')}-${monthMatch[2].padStart(2, '0')}`;
    }
  }

  return null;
}

function extractNumberFromText(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const numStr = cleanNumberValue(match[1] || match[0]);
      const num = parseInt(numStr.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }
  return null;
}

function calculateSimilarity(s1: string, s2: string): number {
  const a = s1.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const b = s2.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;

  const maxLen = Math.max(a.length, b.length);
  const minLen = Math.min(a.length, b.length);
  if (maxLen === 0) return 1;

  let edits = 0;
  for (let i = 0; i < minLen; i++) {
    if (a[i] !== b[i]) edits++;
  }
  edits += maxLen - minLen;
  return 1 - edits / maxLen;
}

function fuzzyMatch(str1: string | null | undefined, str2: string | null | undefined, threshold: number): boolean {
  if (!str1 || !str2) return false;
  const s1 = str1.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return true;
  const similarity = calculateSimilarity(s1, s2);
  return similarity >= threshold;
}

function isSimilar(val1: number | null | undefined, val2: number | null | undefined, tolerance: number): boolean {
  if (!val1 || !val2) return false;
  const diff = Math.abs(val1 - val2) / Math.max(val1, val2);
  return diff <= tolerance;
}

function calculateDifference(val1: number | null | undefined, val2: number | null | undefined): number {
  if (!val1 || !val2) return 100;
  return Math.round((Math.abs(val1 - val2) / Math.max(val1, val2)) * 100);
}

function isRecentDate(dateStr: string | null, maxAgeDays: number): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= maxAgeDays && diffDays >= -1;
}

function extractSalary(normalized: NormalizedOutput, type: 'gross' | 'net'): number | null {
  const typePatterns = type === 'gross'
    ? [/gross\s*(?:salary|income|pay)?\D*(\d+[\d,]*)/i, /basic\s*(?:salary|pay)?\D*(\d+[\d,]*)/i]
    : [/net\s*(?:salary|income|pay)?\D*(\d+[\d,]*)/i, /total\s*(?:salary|pay|income)?\D*(\d+[\d,]*)/i];

  let amount = extractNumberFromText(normalized.cleanedText, typePatterns);
  if (amount) return amount;

  const numberPatterns = [/(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi];
  const numbers: number[] = [];

  if (type === 'gross') {
    const salaryKeywords = ['salary', 'gross', 'income', 'monthly'];
    const lines = normalized.rawLines;
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (salaryKeywords.some((k) => lowerLine.includes(k))) {
        const num = extractNumberFromText(line, numberPatterns);
        if (num) numbers.push(num);
      }
    }
  }

  const allNumbers = normalized.cleanedText.match(/\d{4,7}/g);
  if (allNumbers) {
    for (const n of allNumbers) {
      const num = parseInt(n, 10);
      if (num > 5000 && num < 10000000) numbers.push(num);
    }
  }

  if (numbers.length > 0) {
    numbers.sort((a, b) => b - a);
    return type === 'gross' ? numbers[0] : numbers[numbers.length > 1 ? numbers.length - 1 : 0];
  }

  return null;
}

function extractName(normalized: NormalizedOutput): string | null {
  const namePatterns = [
    /(?:employee|name|employee name|name of employee)\s*:?\s*([A-Za-z\s\.]+)/i,
    /(?:account\s+holder|holder)\s*:?\s*([A-Za-z\s\.]+)/i,
  ];

  for (const pattern of namePatterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) {
      const name = match[1].trim();
      if (name.length > 2) return name;
    }
  }

  return null;
}

function extractEmployer(normalized: NormalizedOutput): string | null {
  const patterns = [
    /(?:employer|company|organization|firm|employer name)\s*:?\s*([A-Za-z\s\.&]+)/i,
    /(?:bank\s+name|bank)\s*:?\s*([A-Za-z\s\.&]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) {
      const employer = match[1].trim();
      if (employer.length > 2) return employer;
    }
  }

  return null;
}

function extractDate(normalized: NormalizedOutput): string | null {
  const dateContextPatterns = [
    /(?:date|issue date|issued|date of issue)\s*:?\s*([A-Za-z0-9\/\-\.,\s]+)/i,
    /(?:for the month|month of|period)\s*:?\s*([A-Za-z0-9\/\-\.,\s]+)/i,
  ];

  for (const pattern of dateContextPatterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) {
      const parsed = parseDateString(match[1].trim());
      if (parsed) return parsed;
    }
  }

  const dateRegex = /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/;
  const dateMatch = normalized.cleanedText.match(dateRegex);
  if (dateMatch) {
    const parsed = parseDateString(dateMatch[1]);
    if (parsed) return parsed;
  }

  const ddMmRegex = /\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b/;
  const ddMmMatch = normalized.cleanedText.match(ddMmRegex);
  if (ddMmMatch) {
    const parsed = parseDateString(ddMmMatch[1]);
    if (parsed) return parsed;
  }

  return null;
}

function extractEmployeeId(normalized: NormalizedOutput): string | null {
  const patterns = [
    /(?:employee\s*(?:id|no|number|code)|emp\s*(?:id|no))\s*:?\s*([A-Za-z0-9\-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractAccountNumber(normalized: NormalizedOutput): string | null {
  const patterns = [
    /(?:account\s*(?:no|number|#|a\/c))\s*:?\s*([A-Za-z0-9\-]+)/i,
    /a\/c\s*:?\s*([A-Za-z0-9\-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) return match[1].trim();
  }

  return null;
}

function extractBankName(normalized: NormalizedOutput): string | null {
  return extractEmployer(normalized);
}

function extractMonthlyDeposits(normalized: NormalizedOutput): number[] {
  const deposits: number[] = [];
  const depositPattern = /(?:deposit|credit|salary)\s*:?\s*(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
  let match;
  while ((match = depositPattern.exec(normalized.cleanedText)) !== null) {
    const num = parseInt(match[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0 && num < 10000000) deposits.push(num);
  }
  return deposits;
}

function extractAuthorityName(normalized: NormalizedOutput): string | null {
  const patterns = [
    /(?:issuing authority|issued by|authority)\s*:?\s*([A-Za-z\s\.]+)/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) {
      const auth = match[1].trim();
      if (auth.length > 2) return auth;
    }
  }
  return null;
}

function extractCertifiedAmount(normalized: NormalizedOutput): number | null {
  const patterns = [
    /(?:certified|annual|income|certified income)\s*(?:amount)?\s*:?\s*(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  return extractNumberFromText(normalized.cleanedText, patterns);
}

function extractRegistrationNumber(normalized: NormalizedOutput): string | null {
  const patterns = [
    /(?:registration|regd|reg)\s*(?:no|number)?\s*:?\s*([A-Za-z0-9\-/]+)/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractBusinessName(normalized: NormalizedOutput): string | null {
  return extractEmployer(normalized);
}

function extractSenderName(normalized: NormalizedOutput): string | null {
  return extractName(normalized);
}

function detectSalaryDeposit(normalized: NormalizedOutput): boolean {
  const salaryPatterns = [/salary/i, /payroll/i, /wages/i, /salary credit/i, /monthly salary/i];
  for (const line of normalized.rawLines) {
    if (salaryPatterns.some((p) => p.test(line))) return true;
  }
  return false;
}

function extractSalaryAmount(normalized: NormalizedOutput): number | null {
  const salaryContextPatterns = [
    /salary\s*(?:credit)?\s*:?\s*(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
    /(?:salary|payroll|wages)\D*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
  ];
  for (const pattern of salaryContextPatterns) {
    const match = normalized.cleanedText.match(pattern);
    if (match) {
      const num = parseInt(match[1].replace(/,/g, ''), 10);
      if (!isNaN(num) && num > 0 && num < 10000000) return num;
    }
  }
  return null;
}

function extractTotalCredits(normalized: NormalizedOutput): number | null {
  const creditLines = normalized.rawLines.filter((l) =>
    /credit|deposit|received/i.test(l) && /\d{4,}/.test(l)
  );
  if (creditLines.length === 0) return null;
  let total = 0;
  for (const line of creditLines) {
    const nums = line.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g);
    if (nums) {
      for (const n of nums) {
        const val = parseInt(n.replace(/,/g, ''), 10);
        if (val > 0 && val < 10000000) total += val;
      }
    }
  }
  return total > 0 ? total : null;
}

function extractTotalDebits(normalized: NormalizedOutput): number | null {
  const debitLines = normalized.rawLines.filter((l) =>
    /debit|withdraw|paid|payment/i.test(l) && /\d{4,}/.test(l)
  );
  if (debitLines.length === 0) return null;
  let total = 0;
  for (const line of debitLines) {
    const nums = line.match(/\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g);
    if (nums) {
      for (const n of nums) {
        const val = parseInt(n.replace(/,/g, ''), 10);
        if (val > 0 && val < 10000000) total += val;
      }
    }
  }
  return total > 0 ? total : null;
}

function extractLargestDeposit(normalized: NormalizedOutput): number | null {
  const depositPattern = /(?:deposit|credit|salary)\s*:?\s*(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi;
  let largest = null;
  let match;
  while ((match = depositPattern.exec(normalized.cleanedText)) !== null) {
    const num = parseInt(match[1].replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0 && num < 10000000) {
      if (largest === null || num > largest) largest = num;
    }
  }
  return largest;
}

function countTransactions(normalized: NormalizedOutput): number {
  return normalized.rawLines.filter((l) => /\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/.test(l)).length;
}

export const documentExtractionService = {
  normalizeOcrOutput(ocrResult: OcrResult, documentType: string): NormalizedOutput {
    const fullText = normalizeNepaliNumber(ocrResult.fullText);
    const cleanedText = cleanText(fullText);

    return {
      documentType,
      rawLines: ocrResult.textLines,
      cleanedText,
      keywordMatches: extractKeywords(cleanedText, documentType),
    };
  },

  extractFinancialFields(normalized: NormalizedOutput): ExtractionResult {
    const extracted: ExtractionResult = {
      documentType: normalized.documentType,
      extractedData: {},
      confidence: {},
    };

    switch (normalized.documentType) {
      case 'SALARY_SLIP': {
        const employeeName = extractName(normalized);
        const grossSalary = extractSalary(normalized, 'gross');
        const netSalary = extractSalary(normalized, 'net');
        const issueDate = extractDate(normalized);
        const employerName = extractEmployer(normalized);
        const employeeId = extractEmployeeId(normalized);

        extracted.extractedData = {
          employeeName,
          grossSalary,
          netSalary,
          issueDate,
          employerName,
          employeeId,
        };

        extracted.confidence = {
          employeeName: employeeName ? 0.88 : 0,
          grossSalary: grossSalary ? 0.92 : 0,
          netSalary: netSalary ? 0.90 : 0,
          issueDate: issueDate ? 0.85 : 0,
          employerName: employerName ? 0.82 : 0,
          employeeId: employeeId ? 0.75 : 0,
        };
        break;
      }

      case 'BANK_STATEMENT': {
        const accountHolderName = extractName(normalized);
        const accountNumber = extractAccountNumber(normalized);
        const bankName = extractBankName(normalized);
        const deposits = extractMonthlyDeposits(normalized);
        const avgDeposit = deposits.length > 0
          ? Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length)
          : null;

        const salaryDepositDetected = detectSalaryDeposit(normalized);
        const salaryAmountDetected = salaryDepositDetected
          ? extractSalaryAmount(normalized) || avgDeposit
          : null;
        const totalCredits = extractTotalCredits(normalized);
        const totalDebits = extractTotalDebits(normalized);
        const largestDeposit = extractLargestDeposit(normalized);
        const transactionCount = countTransactions(normalized);

        extracted.extractedData = {
          accountHolderName,
          accountNumber,
          bankName,
          deposits: deposits.length,
          averageMonthlyDeposit: avgDeposit,
          salaryDepositDetected,
          salaryAmountDetected,
          totalCredits,
          totalDebits,
          largestSingleDeposit: largestDeposit,
          transactionCount,
          netCashFlow: totalCredits !== null && totalDebits !== null ? totalCredits - totalDebits : null,
        };

        extracted.confidence = {
          accountHolderName: accountHolderName ? 0.90 : 0,
          accountNumber: accountNumber ? 0.86 : 0,
          bankName: bankName ? 0.88 : 0,
          deposits: deposits.length > 0 ? 0.78 : 0,
          averageMonthlyDeposit: avgDeposit ? 0.80 : 0,
          salaryDepositDetected: salaryDepositDetected ? 0.75 : 0,
          salaryAmountDetected: salaryAmountDetected ? 0.75 : 0,
          totalCredits: totalCredits ? 0.70 : 0,
          totalDebits: totalDebits ? 0.70 : 0,
        };
        break;
      }

      case 'INCOME_CERT': {
        const holderName = extractName(normalized);
        const certifiedAmount = extractCertifiedAmount(normalized);
        const issueDate = extractDate(normalized);
        const authorityName = extractAuthorityName(normalized);

        extracted.extractedData = {
          certificateHolderName: holderName,
          certifiedIncome: certifiedAmount,
          issueDate,
          issuingAuthority: authorityName,
        };

        extracted.confidence = {
          certificateHolderName: holderName ? 0.88 : 0,
          certifiedIncome: certifiedAmount ? 0.85 : 0,
          issueDate: issueDate ? 0.80 : 0,
          issuingAuthority: authorityName ? 0.78 : 0,
        };
        break;
      }

      case 'BUSINESS_REG': {
        const businessName = extractBusinessName(normalized);
        const registrationNumber = extractRegistrationNumber(normalized);
        const ownerName = extractName(normalized);

        extracted.extractedData = {
          businessName,
          registrationNumber,
          ownerName,
        };

        extracted.confidence = {
          businessName: businessName ? 0.85 : 0,
          registrationNumber: registrationNumber ? 0.80 : 0,
          ownerName: ownerName ? 0.88 : 0,
        };
        break;
      }

      default: {
        const name = extractName(normalized);
        const dateField = extractDate(normalized);
        const amount = extractSalary(normalized, 'gross');

        extracted.extractedData = {
          documentHolderName: name,
          documentDate: dateField,
          documentAmount: amount,
        };

        extracted.confidence = {
          documentHolderName: name ? 0.80 : 0,
          documentDate: dateField ? 0.75 : 0,
          documentAmount: amount ? 0.70 : 0,
        };
        break;
      }
    }

    return extracted;
  },

  compareWithDeclaration(
    extracted: ExtractionResult,
    employment: { monthlyGrossIncome?: number; employerName?: string | null; employmentStartDate?: Date | null } | null,
  ): ComparisonResult {
    const comparison: ComparisonResult = {};

    switch (extracted.documentType) {
      case 'SALARY_SLIP': {
        const declaredSalary = employment?.monthlyGrossIncome ? Number(employment.monthlyGrossIncome) : null;
        const extractedSalary = extracted.extractedData.grossSalary as number | null;

        comparison.salaryMatch = {
          matched: isSimilar(declaredSalary, extractedSalary, 0.15),
          declared: declaredSalary,
          extracted: extractedSalary,
          differencePercent: calculateDifference(declaredSalary, extractedSalary),
          confidence: extracted.confidence.grossSalary || 0,
        };

        const declaredEmployer = employment?.employerName || null;
        const extractedEmployer = extracted.extractedData.employerName as string | null;

        comparison.employerMatch = {
          matched: fuzzyMatch(declaredEmployer, extractedEmployer, 0.80),
          declared: declaredEmployer,
          extracted: extractedEmployer,
          similarity: declaredEmployer && extractedEmployer
            ? Math.round(calculateSimilarity(declaredEmployer, extractedEmployer) * 100)
            : 0,
          confidence: extracted.confidence.employerName || 0,
        };

        const extractedDate = extracted.extractedData.issueDate as string | null;

        comparison.dateMatch = {
          matched: isRecentDate(extractedDate, 95),
          declared: employment?.employmentStartDate?.toISOString().split('T')[0] || null,
          extracted: extractedDate,
          isRecent: isRecentDate(extractedDate, 95),
          confidence: extracted.confidence.issueDate || 0,
        };

        const extractedName = extracted.extractedData.employeeName as string | null;

        comparison.nameMatch = {
          matched: true,
          declared: extractedName,
          extracted: extractedName,
          confidence: extracted.confidence.employeeName || 0,
        };
        break;
      }

      case 'BANK_STATEMENT': {
        const declaredSalary = employment?.monthlyGrossIncome ? Number(employment.monthlyGrossIncome) : null;
        const avgDeposit = extracted.extractedData.averageMonthlyDeposit as number | null;
        const salaryAmountDetected = extracted.extractedData.salaryAmountDetected as number | null;

        const salaryForComparison = salaryAmountDetected || avgDeposit;

        comparison.salaryMatch = {
          matched: isSimilar(declaredSalary, salaryForComparison, 0.25),
          declared: declaredSalary,
          extracted: salaryForComparison,
          differencePercent: calculateDifference(declaredSalary, salaryForComparison),
          confidence: salaryAmountDetected
            ? (extracted.confidence.salaryAmountDetected || 0)
            : (extracted.confidence.averageMonthlyDeposit || 0),
        };

        const salaryDetected = extracted.extractedData.salaryDepositDetected as boolean;

        comparison.salaryPresenceMatch = {
          matched: salaryDetected || !declaredSalary,
          declared: declaredSalary ? 'Salary declared' : 'No declared salary',
          extracted: salaryDetected ? 'Salary deposit detected in statement' : 'No salary deposit detected',
          confidence: extracted.confidence.salaryDepositDetected || 0,
        };

        const extractedName = extracted.extractedData.accountHolderName as string | null;

        comparison.nameMatch = {
          matched: true,
          declared: extractedName,
          extracted: extractedName,
          confidence: extracted.confidence.accountHolderName || 0,
        };
        break;
      }

      default: {
        const declaredSalary = employment?.monthlyGrossIncome ? Number(employment.monthlyGrossIncome) : null;
        const extractedAmount = extracted.extractedData.documentAmount as number | null;

        comparison.salaryMatch = {
          matched: isSimilar(declaredSalary, extractedAmount, 0.20),
          declared: declaredSalary,
          extracted: extractedAmount,
          differencePercent: calculateDifference(declaredSalary, extractedAmount),
          confidence: extracted.confidence.documentAmount || 0,
        };
        break;
      }
    }

    return comparison;
  },

  generateAnomalyFlags(comparison: ComparisonResult, extracted: ExtractionResult, overallOcrConfidence: number): FlagResult {
    const flags: FlagDetail[] = [];

    if (comparison.salaryPresenceMatch && !comparison.salaryPresenceMatch.matched) {
      flags.push({
        type: 'SALARY_NOT_FOUND_IN_STATEMENT',
        severity: 'HIGH',
        message: 'Declared income/salary not found in bank statement deposits',
      });
    }

    if (comparison.salaryMatch && comparison.salaryMatch.declared && comparison.salaryMatch.extracted) {
      const diff = calculateDifference(
        comparison.salaryMatch.declared as number,
        comparison.salaryMatch.extracted as number
      );
      if (diff > 15) {
        flags.push({
          type: 'DECLARED_INCOME_DEPOSIT_MISMATCH',
          severity: diff > 25 ? 'HIGH' : 'MEDIUM',
          message: `Declared income (${comparison.salaryMatch.declared}) and detected deposit (${comparison.salaryMatch.extracted}) differ by ${diff}%`,
        });
      }
    }

    if (comparison.salaryMatch && !comparison.salaryMatch.matched) {
      flags.push({
        type: 'SALARY_MISMATCH',
        severity: comparison.salaryMatch.differencePercent && comparison.salaryMatch.differencePercent > 25 ? 'HIGH' : 'MEDIUM',
        message: comparison.salaryMatch.differencePercent
          ? `Salary differs by ${comparison.salaryMatch.differencePercent}% (declared: ${comparison.salaryMatch.declared}, extracted: ${comparison.salaryMatch.extracted})`
          : 'Salary could not be matched',
      });
    }

    if (comparison.employerMatch && !comparison.employerMatch.matched) {
      flags.push({
        type: 'EMPLOYER_MISMATCH',
        severity: 'MEDIUM',
        message: `Employer name mismatch: "${comparison.employerMatch.declared}" vs "${comparison.employerMatch.extracted}"`,
      });
    }

    if (comparison.dateMatch && !comparison.dateMatch.matched) {
      flags.push({
        type: 'DOCUMENT_EXPIRED',
        severity: 'HIGH',
        message: 'Document date is too old or could not be extracted',
      });
    }

    if (overallOcrConfidence < 0.7) {
      flags.push({
        type: 'LOW_OCR_CONFIDENCE',
        severity: 'MEDIUM',
        message: `Overall OCR confidence is low: ${Math.round(overallOcrConfidence * 100)}%`,
      });
    }

    const confValues = Object.values(extracted.confidence);
    if (confValues.length > 0) {
      const lowConfFields = Object.entries(extracted.confidence)
        .filter(([, v]) => v < 0.60)
        .map(([k]) => k);
      if (lowConfFields.length > 0) {
        flags.push({
          type: 'LOW_FIELD_CONFIDENCE',
          severity: 'MEDIUM',
          message: `Low confidence fields: ${lowConfFields.join(', ')}`,
        });
      }
    }

    const missingFields = Object.entries(extracted.extractedData)
      .filter(([, v]) => v === null || v === undefined)
      .map(([k]) => k);
    if (missingFields.length > 0) {
      flags.push({
        type: 'MISSING_FIELDS',
        severity: extracted.documentType === 'SALARY_SLIP' && missingFields.includes('grossSalary') ? 'HIGH' : 'LOW',
        message: `Could not extract: ${missingFields.join(', ')}`,
      });
    }

    return {
      flagList: flags.map((f) => f.type),
      count: flags.length,
      details: flags,
    };
  },
};
