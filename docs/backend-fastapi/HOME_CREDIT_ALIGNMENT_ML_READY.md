# Home Credit Dataset Alignment — Parameter Mapping & ML-Ready Scoring

**Single Comprehensive OpenCode Prompt**

Align the User Financial Portfolio module EXACTLY with Home Credit Default Risk dataset. No mismatches. ML-ready implementation.

---

## PART 1: HOME CREDIT DATASET — TOP 7 CRITICAL FEATURES

These are the features that matter for loan default prediction. Everything else is noise.

| Rank | Home Credit Feature | Data Type | Range | What It Measures | Our Field |
|------|-------------------|-----------|-------|-----------------|-----------|
| 1 | **AMT_INCOME_TOTAL** | Numeric | 25,650 - 117,000,000 | Annual income (most important predictor) | `employmentInfo.annualIncome` |
| 2 | **AMT_CREDIT** | Numeric | 25,650 - 4,050,000 | Loan amount requested | `loanApplication.requestedAmount` |
| 3 | **DAYS_BIRTH** | Numeric (negative) | -21,489 to -9,461 | Age in days (negative from today) | Calculated from KYC `dateOfBirth` |
| 4 | **DAYS_EMPLOYED** | Numeric (negative) | -17,912 to 0 | Employment duration in days (negative) | Calculated from `employmentInfo.employmentStartDate` |
| 5 | **AMT_ANNUITY** | Numeric | 1,615 - 258,025 | Monthly loan payment (EMI) | Calculated: `requestedAmount / (tenure_months / 12) / 12` |
| 6 | **OCCUPATION_TYPE** | Categorical | 18 categories | Type of job | `employmentInfo.occupationJobTitle` (categorized) |
| 7 | **CNT_CHILDREN** | Numeric | 0 - 5 | Number of dependents | `employmentInfo.dependentsCount` |

**STOP.** Don't collect other features. These 7 + derived metrics are enough.

---

## PART 2: DERIVED FEATURES (Calculated from Above 7)

Home Credit model uses derived features. We must calculate them too.

| Derived Feature | Formula | What It Means | Default Risk Insight |
|-----------------|---------|---------------|----------------------|
| **CREDIT_INCOME_PERCENT** | (AMT_CREDIT / AMT_INCOME_TOTAL) × 100 | Loan size as % of annual income | >300% = high risk (loan > 3x annual income) |
| **ANNUITY_INCOME_PERCENT** | (AMT_ANNUITY × 12 / AMT_INCOME_TOTAL) × 100 | Annual EMI as % of annual income | >30% = high risk (EMI > 30% of income) |
| **INCOME_PER_PERSON** | AMT_INCOME_TOTAL / (1 + CNT_CHILDREN) | Income per family member | Lower = higher risk (more dependents to support) |
| **DAYS_EMPLOYED_PERCENT** | (DAYS_EMPLOYED / DAYS_BIRTH) × 100 | Employment duration as % of age | <30% = risky (short employment history) |
| **EMPLOYMENT_STABILITY** | 1 if DAYS_EMPLOYED > 1825 (5 years) else 0 | Binary: stable (5+ yrs) or not | 1 = lower risk |
| **AGE_CATEGORY** | 1 if 25 < age < 60 else 0 | Binary: prime working age or not | 1 = lower risk |

**Implementation:** Calculate all 6 derived features automatically. Feed to ML model.

---

## PART 3: EXACT FIELD MAPPING

### Portfolio Collection → Home Credit Feature

```
COLLECTION PHASE (User submits portfolio)
┌──────────────────────────────────────────────────────────────┐
│ User Input                                                   │
├──────────────────────────────────────────────────────────────┤
│ Job Start Date: 2019-03-15                                  │
│ Monthly Gross Salary: 250,000 NPR                           │
│ Loan Requested: 1,500,000 NPR                               │
│ Loan Tenure: 36 months                                       │
│ Dependents: 1                                                │
│ Current Date: 2024-07-20 (today)                            │
│ DOB: 1990-05-15 (from KYC)                                  │
└──────────────────────────────────────────────────────────────┘
                           ↓
CALCULATION PHASE
┌──────────────────────────────────────────────────────────────┐
│ Derived Values                                               │
├──────────────────────────────────────────────────────────────┤
│ Annual Income = 250,000 × 12 = 3,000,000 NPR                │
│ Age = TODAY - DOB = 34 years = 12,410 days                  │
│ Employment Duration = TODAY - 2019-03-15 = 5.33 years       │
│                     = 1,946 days                             │
│ Monthly EMI = 1,500,000 / (36/12) / 12 = 41,667 NPR         │
│ Annual EMI = 41,667 × 12 = 500,000 NPR                      │
└──────────────────────────────────────────────────────────────┘
                           ↓
HOME CREDIT MAPPING
┌──────────────────────────────────────────────────────────────┐
│ ML Model Input                                               │
├──────────────────────────────────────────────────────────────┤
│ AMT_INCOME_TOTAL = 3,000,000                                │
│ AMT_CREDIT = 1,500,000                                      │
│ DAYS_BIRTH = -12,410 (negative = past from today)           │
│ DAYS_EMPLOYED = -1,946 (negative = past from today)         │
│ AMT_ANNUITY = 41,667                                        │
│ OCCUPATION_TYPE = "Engineer"                                │
│ CNT_CHILDREN = 1                                            │
├──────────────────────────────────────────────────────────────┤
│ CREDIT_INCOME_PERCENT = (1,500,000/3,000,000)×100 = 50%    │
│ ANNUITY_INCOME_PERCENT = (500,000/3,000,000)×100 = 16.7%   │
│ INCOME_PER_PERSON = 3,000,000 / 2 = 1,500,000              │
│ DAYS_EMPLOYED_PERCENT = (1,946/12,410)×100 = 15.7%         │
│ EMPLOYMENT_STABILITY = 1 (5+ years employed)                │
│ AGE_CATEGORY = 1 (age 34, within 25-60)                     │
└──────────────────────────────────────────────────────────────┘
```

---

## PART 4: RISK SCORING ALIGNED WITH HOME CREDIT MODEL

### Rule-Based Risk Scoring (Current Approach)

```typescript
function calculateRiskScoreRuleBased(borrower) {
  let riskScore = 0;

  // 1. CREDIT_INCOME_PERCENT (Loan too big?)
  if (borrower.creditIncomePercent > 300) riskScore += 40;      // > 3x income
  else if (borrower.creditIncomePercent > 200) riskScore += 25; // > 2x income
  else if (borrower.creditIncomePercent > 100) riskScore += 10; // > 1x income
  else riskScore += 0;

  // 2. ANNUITY_INCOME_PERCENT (Monthly payment affordable?)
  if (borrower.annuityIncomePercent > 50) riskScore += 30;      // > 50% of income
  else if (borrower.annuityIncomePercent > 30) riskScore += 20; // > 30% of income
  else if (borrower.annuityIncomePercent > 15) riskScore += 5;  // > 15% of income
  else riskScore += 0;

  // 3. DAYS_EMPLOYED_PERCENT (Employment history solid?)
  if (borrower.daysEmployedPercent < 10) riskScore += 35;       // < 1 year employed
  else if (borrower.daysEmployedPercent < 25) riskScore += 20;  // < 2.5 years
  else if (borrower.daysEmployedPercent < 40) riskScore += 10;  // < 4 years
  else riskScore += 0;

  // 4. AGE_CATEGORY (Age risk?)
  if (borrower.age < 21 || borrower.age > 70) riskScore += 20;  // Too young or old
  else if (borrower.age < 25 || borrower.age > 60) riskScore += 10;
  else riskScore += 0;

  // 5. INCOME_PER_PERSON (Family size risk?)
  if (borrower.incomePerPerson < 500000) riskScore += 15;       // Low per-person income
  else riskScore += 0;

  // 6. EMPLOYMENT_STABILITY (Stable job?)
  if (!borrower.employmentStable) riskScore += 20;              // < 5 years
  else riskScore += 0;

  // Clamp score 0-100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Assign risk level
  let riskLevel = riskScore < 40 ? 'LOW' : riskScore < 70 ? 'MEDIUM' : 'HIGH';

  return { riskScore, riskLevel };
}
```

### Machine Learning Model (Placeholder for Future)

**Status:** ML-based scoring deferred. Will implement using XGBoost or CatBoost after portfolio module is stable.

**Future Architecture:**
- Train on Home Credit dataset using all 7 core + 6 derived features
- Output: Default probability (0-1) → convert to risk score (0-100)
- Replace rule-based logic with ML predictions when ready
- Keep rule-based as fallback if model unavailable

**Stub for Future (Do NOT implement now):**
```typescript
// TODO: ML Integration (Future)
// async function calculateRiskScoreML(features: HomeCredtFeatures): Promise<{ riskScore: number, defaultProbability: number }> {
//   // 1. Load trained XGBoost/CatBoost model from disk or API
//   // 2. Call model.predict() with all 13 features
//   // 3. Convert default_probability to risk_score (0-100)
//   // 4. Return risk score
//   // For now: Use rule-based scoring
// }
```

**Current Implementation:** Use rule-based scoring. All infrastructure prepared for ML swap-in later.

---

## PART 5: DATABASE IMPLEMENTATION

### Update Portfolio Models to Match Home Credit

**File: `prisma/schema.prisma`**

Replace EmploymentInfo model with this:

```prisma
model EmploymentInfo {
  id                        String   @id @default(cuid())
  userId                    String   @unique
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // HOME CREDIT MAPPING: Core Fields
  employmentStatus          String   @default("UNEMPLOYED")
  occupationJobTitle        String?  // Maps to OCCUPATION_TYPE
  employerName              String?
  employmentStartDate       DateTime?
  
  // HOME CREDIT MAPPING: Income Fields
  monthlyGrossIncome        Decimal  @db.Decimal(12, 2)  // Monthly salary
  annualIncome              Decimal  @db.Decimal(12, 2)  // AMT_INCOME_TOTAL (Annual)
  
  // HOME CREDIT MAPPING: Dependent Count
  dependentsCount           Int      @default(0)         // CNT_CHILDREN
  
  // Calculated Fields (Home Credit Derived)
  employmentTenureMonths    Int?
  employmentTenureDays      Int?     // DAYS_EMPLOYED (calculated, negative)
  employmentStable          Boolean  @default(false)     // 1 if > 5 years
  incomeSourceType          String   @default("SALARY")
  incomeStabilityScore      Int      @default(50)        // 1-100
  
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  @@index([userId])
  @@map("employment_info")
  @@schema("auth")
}

model LoanFeatures {
  id                        String   @id @default(cuid())
  userId                    String   @unique
  user                      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  loanApplicationId         String?  // FK to active loan
  
  // HOME CREDIT MAPPING: Loan Features
  requestedLoanAmount       Decimal  @db.Decimal(12, 2)  // AMT_CREDIT
  loanTenureMonths          Int
  calculatedEMI             Decimal  @db.Decimal(10, 2)  // AMT_ANNUITY
  
  // Derived Features (Home Credit Model)
  creditIncomePercent       Decimal  @db.Decimal(5, 2)   // AMT_CREDIT / AMT_INCOME × 100
  annuityIncomePercent      Decimal  @db.Decimal(5, 2)   // (EMI×12) / AMT_INCOME × 100
  
  // Additional From Portfolio
  totalDebtObligations      Decimal  @db.Decimal(12, 2)  // Sum of all EMIs
  debtToIncomeRatio         Decimal  @db.Decimal(5, 2)   // (Debt + EMI) / Income × 100
  
  // Calculated Safety Metrics
  incomePerPerson           Decimal  @db.Decimal(12, 2)  // Income / (1 + dependents)
  availableMonthlyCapacity  Decimal  @db.Decimal(10, 2)  // Income - expenses - existing debt
  
  // Risk Assessment
  riskScore                 Int      @default(50)        // 0-100
  riskLevel                 String   @default("MEDIUM")  // LOW, MEDIUM, HIGH
  defaultProbability        Float?   // 0-1 if ML model used
  
  lastCalculated            DateTime @default(now())
  
  @@index([userId])
  @@map("loan_features")
  @@schema("auth")
}
```

Run migration:
```bash
npx prisma migrate dev --name align_home_credit_features
```

---

## PART 6: CALCULATE HOME CREDIT FIELDS

### Service to Compute All Features

**File: `src/services/homeCredtFeatureService.ts`**

```typescript
import { prisma } from '@/config/database';
import { Decimal } from '@prisma/client/runtime/library';

export const homeCredtFeatureService = {
  /**
   * Calculate all Home Credit features from portfolio data
   * Input: User's portfolio (employment, loan request, dependents)
   * Output: All 7 core + 6 derived features ready for ML model
   */
  async calculateAllFeatures(userId: string, loanRequestAmount: number, loanTenureMonths: number) {
    // Fetch user employment info
    const employment = await prisma.employmentInfo.findUnique({
      where: { userId }
    });

    if (!employment) {
      throw new Error('Employment info not found');
    }

    // Fetch user KYC for age
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user?.profile?.dateOfBirth) {
      throw new Error('Date of birth not found');
    }

    // ===== CORE FEATURES (Home Credit) =====

    // 1. AMT_INCOME_TOTAL (Annual income)
    const amtIncomeTotal = employment.annualIncome.toNumber();

    // 2. AMT_CREDIT (Loan requested)
    const amtCredit = loanRequestAmount;

    // 3. DAYS_BIRTH (Age in days, negative)
    const today = new Date();
    const birthDate = user.profile.dateOfBirth;
    const daysSinceBirth = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysBirth = -daysSinceBirth; // Negative as per Home Credit

    // 4. DAYS_EMPLOYED (Employment duration in days, negative)
    const employmentStartDate = employment.employmentStartDate;
    if (!employmentStartDate) {
      throw new Error('Employment start date not found');
    }
    const daysSinceEmployment = Math.floor((today.getTime() - employmentStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysEmployed = -daysSinceEmployment; // Negative as per Home Credit

    // 5. AMT_ANNUITY (Monthly loan payment)
    const amtAnnuity = this.calculateEMI(amtCredit, loanTenureMonths);

    // 6. OCCUPATION_TYPE (Occupation, categorical)
    const occupationType = employment.occupationJobTitle || 'Unknown';

    // 7. CNT_CHILDREN (Number of dependents)
    const cntChildren = employment.dependentsCount;

    // ===== DERIVED FEATURES =====

    // CREDIT_INCOME_PERCENT
    const creditIncomePercent = (amtCredit / amtIncomeTotal) * 100;

    // ANNUITY_INCOME_PERCENT (Annual EMI as % of annual income)
    const annualEMI = amtAnnuity * 12;
    const annuityIncomePercent = (annualEMI / amtIncomeTotal) * 100;

    // INCOME_PER_PERSON
    const incomePerPerson = amtIncomeTotal / (1 + cntChildren);

    // DAYS_EMPLOYED_PERCENT
    const daysEmployedPercent = (daysSinceEmployment / daysSinceBirth) * 100;

    // EMPLOYMENT_STABILITY (1 if > 5 years, else 0)
    const employmentStability = daysSinceEmployment > 5 * 365 ? 1 : 0;

    // AGE_CATEGORY (1 if 25-60, else 0)
    const ageYears = daysSinceBirth / 365;
    const ageCategory = ageYears >= 25 && ageYears <= 60 ? 1 : 0;

    // ===== STORE ALL FEATURES =====

    const features = await prisma.loanFeatures.upsert({
      where: { userId },
      update: {
        requestedLoanAmount: new Decimal(amtCredit),
        loanTenureMonths,
        calculatedEMI: new Decimal(amtAnnuity),
        creditIncomePercent: new Decimal(creditIncomePercent.toFixed(2)),
        annuityIncomePercent: new Decimal(annuityIncomePercent.toFixed(2)),
        incomePerPerson: new Decimal(incomePerPerson.toFixed(2)),
        lastCalculated: new Date()
      },
      create: {
        userId,
        requestedLoanAmount: new Decimal(amtCredit),
        loanTenureMonths,
        calculatedEMI: new Decimal(amtAnnuity),
        creditIncomePercent: new Decimal(creditIncomePercent.toFixed(2)),
        annuityIncomePercent: new Decimal(annuityIncomePercent.toFixed(2)),
        incomePerPerson: new Decimal(incomePerPerson.toFixed(2))
      }
    });

    return {
      homeCredtFeatures: {
        AMT_INCOME_TOTAL: amtIncomeTotal,
        AMT_CREDIT: amtCredit,
        DAYS_BIRTH: daysBirth,
        DAYS_EMPLOYED: daysEmployed,
        AMT_ANNUITY: amtAnnuity,
        OCCUPATION_TYPE: occupationType,
        CNT_CHILDREN: cntChildren
      },
      derivedFeatures: {
        CREDIT_INCOME_PERCENT: creditIncomePercent,
        ANNUITY_INCOME_PERCENT: annuityIncomePercent,
        INCOME_PER_PERSON: incomePerPerson,
        DAYS_EMPLOYED_PERCENT: daysEmployedPercent,
        EMPLOYMENT_STABILITY: employmentStability,
        AGE_CATEGORY: ageCategory
      }
    };
  },

  /**
   * Calculate EMI (Equated Monthly Installment)
   * Formula: P × r × (1+r)^n / ((1+r)^n - 1)
   * Annual rate: 18%
   */
  calculateEMI(principal: number, tenureMonths: number): number {
    const annualRate = 0.18;
    const monthlyRate = annualRate / 12;
    const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
    const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;
    const emi = numerator / denominator;
    return Math.round(emi);
  }
};
```

---

## PART 7: RISK SCORING ENDPOINT

**File: `src/controllers/riskScoringController.ts`**

```typescript
import { homeCredtFeatureService } from '@/services/homeCredtFeatureService';
import { riskScoringService } from '@/services/riskScoringService';

export const calculateRiskScore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json(apiResponse.error('Unauthorized', 401));
    }

    const { requestedLoanAmount, loanTenureMonths } = req.body;

    // Step 1: Calculate all Home Credit features
    const features = await homeCredtFeatureService.calculateAllFeatures(
      req.user.id,
      requestedLoanAmount,
      loanTenureMonths
    );

    // Step 2: Calculate risk score (Option A: Rule-based)
    const { riskScore, riskLevel } = riskScoringService.calculateRiskScoreRuleBased(
      features.derivedFeatures
    );

    // Step 3: (Optional) Get ML prediction if model available
    // const defaultProbability = riskScoringService.predictWithXGBoost(
    //   features.homeCredtFeatures,
    //   features.derivedFeatures
    // );

    res.json(apiResponse.success('Risk score calculated', {
      requestedLoanAmount,
      loanTenureMonths,
      calculatedEMI: features.derivedFeatures.amtAnnuity,
      riskScore,
      riskLevel,
      homeCredtFeatures: features.homeCredtFeatures,
      derivedFeatures: features.derivedFeatures,
      approvalRecommendation: riskLevel === 'LOW' ? 'AUTO_APPROVE' : 'MANUAL_REVIEW'
    }));

    await auditService.log({
      userId: req.user.id,
      action: 'CALCULATE_RISK_SCORE',
      metadata: { requestedLoanAmount, riskScore, riskLevel },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    next(error);
  }
};
```

---

## PART 8: ROUTE INTEGRATION

**File: `src/routes/loanRoutes.ts`**

Add this endpoint:

```typescript
router.post(
  '/calculate-risk',
  authenticate,
  validate(calculateRiskSchema),
  calculateRiskScore
);
```

**Validation schema:**

```typescript
const calculateRiskSchema = z.object({
  body: z.object({
    requestedLoanAmount: z.number().positive().max(10000000),
    loanTenureMonths: z.number().int().min(6).max(84)
  })
});
```

---

## PART 9: FRONTEND DISPLAY

**File: `src/features/loans/components/RiskScoreDisplay.tsx`**

```tsx
export const RiskScoreDisplay = ({ riskScore, riskLevel, homeCredtFeatures, derivedFeatures }) => {
  const getRiskColor = (level) => {
    if (level === 'LOW') return '#10b981';
    if (level === 'MEDIUM') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="panel">
      <h3>Loan Eligibility Assessment</h3>
      
      {/* Risk Score Display */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          color: getRiskColor(riskLevel),
          marginBottom: '0.5rem'
        }}>
          {riskScore}
        </div>
        <div style={{ fontSize: '1.25rem', color: getRiskColor(riskLevel) }}>
          {riskLevel} RISK
        </div>
      </div>

      {/* Home Credit Features Display */}
      <h4>Your Financial Profile</h4>
      <table>
        <tr>
          <td>Annual Income</td>
          <td>₹{homeCredtFeatures.AMT_INCOME_TOTAL.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Loan Requested</td>
          <td>₹{homeCredtFeatures.AMT_CREDIT.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Monthly Payment (EMI)</td>
          <td>₹{homeCredtFeatures.AMT_ANNUITY.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Employment Duration</td>
          <td>{Math.abs(homeCredtFeatures.DAYS_EMPLOYED) / 365 > toFixed(1)} years</td>
        </tr>
        <tr>
          <td>Dependents</td>
          <td>{homeCredtFeatures.CNT_CHILDREN}</td>
        </tr>
      </table>

      {/* Risk Factors */}
      <h4 style={{ marginTop: '2rem' }}>Risk Factors</h4>
      <ul>
        <li>
          <strong>Loan-to-Income Ratio:</strong> {derivedFeatures.CREDIT_INCOME_PERCENT.toFixed(1)}%
          {derivedFeatures.CREDIT_INCOME_PERCENT > 300 && ' ⚠️ (Loan is >3x annual income)'}
        </li>
        <li>
          <strong>Monthly Payment Burden:</strong> {derivedFeatures.ANNUITY_INCOME_PERCENT.toFixed(1)}% of income
          {derivedFeatures.ANNUITY_INCOME_PERCENT > 30 && ' ⚠️ (>30% of income)'}
        </li>
        <li>
          <strong>Employment Stability:</strong> {derivedFeatures.EMPLOYMENT_STABILITY ? 'Stable (5+ years)' : 'Recent job'}
        </li>
        <li>
          <strong>Age Category:</strong> {derivedFeatures.AGE_CATEGORY ? 'Prime working age' : 'Atypical age'}
        </li>
      </ul>

      {/* Approval Status */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: riskLevel === 'LOW' ? '#d1fae5' : riskLevel === 'MEDIUM' ? '#fef3c7' : '#fee2e2',
        borderRadius: '8px'
      }}>
        {riskLevel === 'LOW' && (
          <p>✅ You are eligible for this loan. You can proceed with application.</p>
        )}
        {riskLevel === 'MEDIUM' && (
          <p>⏳ Your application will be reviewed by a loan officer for final decision.</p>
        )}
        {riskLevel === 'HIGH' && (
          <p>❌ Your loan request appears risky. Consider reducing the loan amount or increasing your income.</p>
        )}
      </div>
    </div>
  );
};
```

---

## PART 10: IMPLEMENTATION CHECKLIST FOR OPENCODE

Follow these steps in order. Do NOT skip. Do NOT add anything extra.

### Step 1: Database Changes
- [ ] Update `prisma/schema.prisma` with EmploymentInfo (add fields) and new LoanFeatures model
- [ ] Run: `npx prisma migrate dev --name align_home_credit_features`
- [ ] Run: `npx prisma generate`

### Step 2: Services
- [ ] Create `src/services/homeCreditFeatureService.ts` with calculateAllFeatures() function
- [ ] Create `src/services/riskScoringService.ts` with calculateRiskScoreRuleBased() function
- [ ] Both files must follow existing service patterns (object exports, error throwing)

### Step 3: Controllers
- [ ] Create `src/controllers/riskScoringController.ts` with calculateRiskScore handler
- [ ] Follow existing controller patterns (try/catch, next(error), apiResponse)

### Step 4: Routes
- [ ] Add POST /loan/calculate-risk endpoint to `src/routes/loanRoutes.ts`
- [ ] Add validation schema to `src/routes/schemas.ts`
- [ ] Register route in `src/routes/index.ts`

### Step 5: Frontend
- [ ] Create `src/features/loans/components/RiskScoreDisplay.tsx`
- [ ] Create hook: `src/features/loans/hooks/useCalculateRiskScore.ts`
- [ ] Call hook from LoanApplicationForm after user fills all fields
- [ ] Display component after risk is calculated

### Step 6: Testing
- [ ] Test endpoint with Postman:
  ```
  POST http://localhost:3000/api/v1/loan/calculate-risk
  {
    "requestedLoanAmount": 1500000,
    "loanTenureMonths": 36
  }
  ```
- [ ] Verify response contains all 7+6 features
- [ ] Verify risk score is 0-100
- [ ] Verify risk level is LOW/MEDIUM/HIGH

---

## PART 11: DATA GUARANTEE

After implementing above, verify:

✅ **Home Credit Features Collected:**
- AMT_INCOME_TOTAL → from employmentInfo.annualIncome
- AMT_CREDIT → from loan request
- DAYS_BIRTH → calculated from KYC.dateOfBirth
- DAYS_EMPLOYED → calculated from employmentInfo.startDate
- AMT_ANNUITY → calculated EMI
- OCCUPATION_TYPE → from employmentInfo.occupationJobTitle
- CNT_CHILDREN → from employmentInfo.dependentsCount

✅ **Derived Features Calculated:**
- CREDIT_INCOME_PERCENT
- ANNUITY_INCOME_PERCENT
- INCOME_PER_PERSON
- DAYS_EMPLOYED_PERCENT
- EMPLOYMENT_STABILITY
- AGE_CATEGORY

✅ **Risk Scoring Working:**
- Endpoint `/loan/calculate-risk` returns riskScore 0-100
- riskLevel is LOW/MEDIUM/HIGH
- All 13 features (7+6) in response

✅ **No Mismatches:**
- What we collect = What Home Credit dataset expects
- What we calculate = What ML model needs
- Frontend shows = What user understands

---

## FINAL REMINDER

**This alignment is non-negotiable.** If you collect different data or calculate different features, your ML model predictions will be WRONG.

Every field has a purpose. Every calculation has a Home Credit mapping. No extras. No missing.

**Execute this exactly. Do not improvise.**

