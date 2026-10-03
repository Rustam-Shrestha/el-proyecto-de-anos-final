--
-- PostgreSQL database dump
--

\restrict xS7EGe49XPHQD72O3jWLN5NKfmQt93cbNrkDwmBmeJ8f76G4C4dBeCYdkyOsPRK

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: DocumentType; Type: TYPE; Schema: auth; Owner: postgres
--

CREATE TYPE auth."DocumentType" AS ENUM (
    'CITIZENSHIP_FRONT',
    'CITIZENSHIP_BACK',
    'SELFIE',
    'INCOME_PROOF',
    'BANK_STATEMENT',
    'EXISTING_LOAN',
    'COLLATERAL',
    'SALARY_SLIP',
    'BUSINESS_REG',
    'INCOME_CERT',
    'PAN',
    'PENSION_LETTER'
);


ALTER TYPE auth."DocumentType" OWNER TO postgres;

--
-- Name: DocumentVerificationStatus; Type: TYPE; Schema: auth; Owner: postgres
--

CREATE TYPE auth."DocumentVerificationStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'VERIFIED',
    'REJECTED',
    'MANUAL_REVIEW'
);


ALTER TYPE auth."DocumentVerificationStatus" OWNER TO postgres;

--
-- Name: LoanPurpose; Type: TYPE; Schema: auth; Owner: postgres
--

CREATE TYPE auth."LoanPurpose" AS ENUM (
    'HOME',
    'EDUCATION',
    'BUSINESS',
    'PERSONAL'
);


ALTER TYPE auth."LoanPurpose" OWNER TO postgres;

--
-- Name: LoanStatus; Type: TYPE; Schema: auth; Owner: postgres
--

CREATE TYPE auth."LoanStatus" AS ENUM (
    'SUBMITTED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE auth."LoanStatus" OWNER TO postgres;

--
-- Name: NotificationStatus; Type: TYPE; Schema: auth; Owner: postgres
--

CREATE TYPE auth."NotificationStatus" AS ENUM (
    'UNREAD',
    'READ',
    'ARCHIVED'
);


ALTER TYPE auth."NotificationStatus" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: auth; Owner: postgres
--

CREATE TYPE auth."NotificationType" AS ENUM (
    'KYC_SUBMITTED',
    'KYC_APPROVED',
    'KYC_REJECTED',
    'KYC_PENDING_REVIEW',
    'PORTFOLIO_SUBMITTED',
    'PORTFOLIO_APPROVED',
    'PORTFOLIO_REJECTED',
    'DOCUMENT_UPLOADED',
    'DOCUMENT_FLAGGED',
    'DOCUMENT_VERIFIED',
    'LOAN_APPLICATION_SUBMITTED',
    'LOAN_APPROVED',
    'LOAN_REJECTED',
    'LOAN_UNDER_REVIEW',
    'LOAN_DISBURSED',
    'LOAN_REPAYMENT_DUE',
    'LOAN_REPAYMENT_OVERDUE',
    'LOAN_REPAYMENT_REMINDER',
    'SYSTEM_ALERT',
    'ADMIN_ACTION_REQUIRED',
    'DOCUMENT_EXPIRING_SOON'
);


ALTER TYPE auth."NotificationType" OWNER TO postgres;

--
-- Name: RiskLevel; Type: TYPE; Schema: auth; Owner: postgres
--

CREATE TYPE auth."RiskLevel" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE auth."RiskLevel" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Role; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth."Role" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth."Role" OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.audit_logs (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text,
    action text NOT NULL,
    metadata jsonb,
    ip text DEFAULT 'unknown'::text NOT NULL,
    "userAgent" text DEFAULT 'unknown'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.audit_logs OWNER TO postgres;

--
-- Name: bank_statements; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.bank_statements (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "bankName" text,
    "accountNumber" text,
    "accountHolderName" text,
    "statementFromDate" timestamp(3) without time zone,
    "statementToDate" timestamp(3) without time zone,
    "openingBalance" numeric(15,2),
    "closingBalance" numeric(15,2),
    "filePath" text,
    "fileChecksum" text,
    "parsingStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.bank_statements OWNER TO postgres;

--
-- Name: borrower_features; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.borrower_features (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "amtIncomeTotal" numeric(12,2),
    "amtCredit" numeric(12,2),
    "daysBirth" integer,
    "daysEmployed" integer,
    "debtToIncomeRatio" numeric(5,2),
    "paymentConsistencyScore" numeric(5,2),
    "cntInstalment" integer DEFAULT 0,
    "amtAnnuity" numeric(12,2),
    "computedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.borrower_features OWNER TO postgres;

--
-- Name: chat_conversations; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.chat_conversations (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "sessionId" text,
    messages jsonb,
    context jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.chat_conversations OWNER TO postgres;

--
-- Name: company_invites; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.company_invites (
    id text NOT NULL,
    "tenantId" integer NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'USER'::character varying NOT NULL,
    token character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "invitedBy" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "acceptedAt" timestamp(3) without time zone
);


ALTER TABLE auth.company_invites OWNER TO postgres;

--
-- Name: company_requests; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.company_requests (
    id text NOT NULL,
    "requestedBy" text NOT NULL,
    "companyName" character varying(255) NOT NULL,
    slug character varying(50) NOT NULL,
    "panNumber" character varying(10) NOT NULL,
    gstin character varying(15),
    "companyType" character varying(50),
    domain character varying(255),
    address text,
    "documentUrls" jsonb,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    "rejectionReason" text,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "tenantId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.company_requests OWNER TO postgres;

--
-- Name: document_versions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.document_versions (
    id text NOT NULL,
    "documentId" text NOT NULL,
    "filePath" text NOT NULL,
    version integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.document_versions OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.documents (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "kycId" text NOT NULL,
    "documentType" auth."DocumentType" NOT NULL,
    "filePath" text NOT NULL,
    "fileMimeType" text,
    "fileSize" integer,
    "ocrStatus" auth."DocumentVerificationStatus" DEFAULT 'PENDING'::auth."DocumentVerificationStatus" NOT NULL,
    "ocrConfidence" double precision,
    "extractedData" jsonb,
    "ocrErrorMessage" text,
    "ocrProcessedAt" timestamp(3) without time zone,
    "verificationStatus" auth."DocumentVerificationStatus" DEFAULT 'PENDING'::auth."DocumentVerificationStatus" NOT NULL,
    "verificationNotes" text,
    "verifiedBy" text,
    "verifiedAt" timestamp(3) without time zone,
    "isDeleted" boolean DEFAULT false NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "replacedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.documents OWNER TO postgres;

--
-- Name: employment_info; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.employment_info (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "employmentStatus" text DEFAULT 'UNEMPLOYED'::text NOT NULL,
    "occupationJobTitle" text,
    "employerName" text,
    "employmentStartDate" timestamp(3) without time zone,
    "monthlyGrossIncome" numeric(12,2) NOT NULL,
    "annualIncome" numeric(12,2) NOT NULL,
    "dependentsCount" integer DEFAULT 0 NOT NULL,
    "businessName" text,
    "businessType" text,
    "institutionName" text,
    "educationLevel" text,
    "expectedGraduationDate" timestamp(3) without time zone,
    "employmentTenureMonths" integer,
    "employmentTenureDays" integer,
    "employmentStable" boolean DEFAULT false NOT NULL,
    "incomeSourceType" text DEFAULT 'SALARY'::text NOT NULL,
    "incomeStabilityScore" integer DEFAULT 50 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.employment_info OWNER TO postgres;

--
-- Name: extraction_verifications; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.extraction_verifications (
    id text NOT NULL,
    "kycApplicationId" text NOT NULL,
    decision text NOT NULL,
    "ocrConfidence" double precision NOT NULL,
    "matchScore" double precision,
    "autoVerified" boolean DEFAULT false NOT NULL,
    "manualReviewAdded" boolean DEFAULT false NOT NULL,
    "decisionDetails" jsonb,
    "verifiedAt" timestamp(3) without time zone,
    "verifiedBy" text,
    locked boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.extraction_verifications OWNER TO postgres;

--
-- Name: face_verifications; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.face_verifications (
    id text NOT NULL,
    "kycApplicationId" text NOT NULL,
    "citizenshipPhotoPath" text NOT NULL,
    "selfiePhotoPath" text NOT NULL,
    "similarityScore" double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    recommendation text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.face_verifications OWNER TO postgres;

--
-- Name: financial_documents; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.financial_documents (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "documentType" text NOT NULL,
    "filePath" text NOT NULL,
    "fileMimeType" text,
    "fileSize" integer,
    "originalName" text,
    "ocrStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "ocrData" jsonb,
    "ocrConfidence" double precision,
    "ocrErrorMessage" text,
    "ocrRawText" text,
    "ocrProcessedAt" timestamp(3) without time zone,
    "extractedFields" jsonb,
    "comparisonResult" jsonb,
    "anomalyFlags" text[] DEFAULT ARRAY[]::text[],
    "flagCount" integer DEFAULT 0 NOT NULL,
    "verificationStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "adminNotes" text,
    "verifiedBy" text,
    "verifiedAt" timestamp(3) without time zone,
    "isExpired" boolean DEFAULT false NOT NULL,
    "expiryDate" timestamp(3) without time zone,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.financial_documents OWNER TO postgres;

--
-- Name: financial_profiles; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.financial_profiles (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "totalStatements" integer DEFAULT 0 NOT NULL,
    "dateRangeStart" timestamp(3) without time zone,
    "dateRangeEnd" timestamp(3) without time zone,
    "avgMonthlyIncome" numeric(15,2),
    "avgMonthlyExpense" numeric(15,2),
    "totalIncome" numeric(15,2),
    "totalExpense" numeric(15,2),
    "totalSavings" numeric(15,2),
    "savingsRate" double precision,
    "debtToIncomeRatio" double precision,
    "incomeStabilityScore" double precision,
    "creditScoreEstimate" integer,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.financial_profiles OWNER TO postgres;

--
-- Name: kyc_applications; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.kyc_applications (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone,
    "reviewerId" text,
    "rejectionReason" text,
    "ocrCitizenshipNumber" text,
    "ocrFullName" text,
    "ocrDateOfBirth" text,
    "ocrGender" text,
    "ocrAddress" text,
    "processingStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "ocrFrontStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "ocrBackStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "faceStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "ocrProcessingError" text,
    "faceProcessingError" text,
    "workflowStage" text DEFAULT 'VALIDATING_FACE'::text NOT NULL,
    "faceVerificationStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "ocrProcessingStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "queuedForManualReview" boolean DEFAULT false NOT NULL,
    "confirmedCitizenshipNumber" text,
    "confirmedFullName" text,
    "confirmedDateOfBirth" text,
    "confirmedGender" text,
    "confirmedAddress" text,
    "confirmedPhoneNumber" text,
    "confirmedEmail" text,
    "confirmedOccupation" text,
    "confirmedEmployer" text,
    "confirmedMonthlyIncome" numeric(12,2),
    "confirmedMaritalStatus" text,
    "confirmedEducationLevel" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.kyc_applications OWNER TO postgres;

--
-- Name: kyc_submission_files; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.kyc_submission_files (
    id text NOT NULL,
    "kycApplicationId" text NOT NULL,
    status text NOT NULL,
    "snapshotData" jsonb,
    "faceSimilarity" double precision,
    "faceStatusAtCreation" text,
    "ocrStatusAtCreation" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.kyc_submission_files OWNER TO postgres;

--
-- Name: loan_accounts; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.loan_accounts (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "loanId" text,
    "principalAmount" numeric(12,2) NOT NULL,
    "outstandingBalance" numeric(12,2) NOT NULL,
    "monthlyEMI" numeric(10,2) NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "expectedEndDate" timestamp(3) without time zone,
    "closedAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.loan_accounts OWNER TO postgres;

--
-- Name: loan_applications; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.loan_applications (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "requestedAmount" numeric(12,2) NOT NULL,
    "tenureMonths" integer NOT NULL,
    purpose auth."LoanPurpose" NOT NULL,
    "calculatedEmi" numeric(10,2),
    status auth."LoanStatus" DEFAULT 'SUBMITTED'::auth."LoanStatus" NOT NULL,
    "riskScore" integer,
    "riskLevel" auth."RiskLevel",
    "loanOfficerNotes" text,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "defaultProbability" double precision,
    "modelVersion" text,
    "shapValues" jsonb,
    "featureSnapshot" jsonb,
    "mlDecision" text,
    "creditScore" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.loan_applications OWNER TO postgres;

--
-- Name: loan_assessments; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.loan_assessments (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "requestedAmount" numeric(15,2) NOT NULL,
    "loanTenureMonths" integer,
    "interestRateAssumed" double precision DEFAULT 10.5 NOT NULL,
    "eligibleAmount" numeric(15,2),
    "maxMonthlyEmi" numeric(15,2),
    "recommendedTenure" integer,
    "eligibilityScore" double precision,
    "riskLevel" text,
    recommendation text,
    "assessmentDetails" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.loan_assessments OWNER TO postgres;

--
-- Name: loan_features; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.loan_features (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "loanApplicationId" text,
    "requestedLoanAmount" numeric(12,2) NOT NULL,
    "loanTenureMonths" integer NOT NULL,
    "calculatedEMI" numeric(10,2) NOT NULL,
    "daysBirth" integer,
    "daysEmployed" integer,
    "occupationType" text,
    "cntChildren" integer,
    "creditIncomePercent" numeric(5,2) NOT NULL,
    "annuityIncomePercent" numeric(5,2) NOT NULL,
    "incomePerPerson" numeric(12,2) NOT NULL,
    "daysEmployedPercent" numeric(5,2),
    "employmentStability" boolean DEFAULT false NOT NULL,
    "ageCategory" integer DEFAULT 0 NOT NULL,
    "totalDebtObligations" numeric(12,2) NOT NULL,
    "debtToIncomeRatio" numeric(5,2) NOT NULL,
    "availableMonthlyCapacity" numeric(10,2) NOT NULL,
    "riskScore" integer DEFAULT 50 NOT NULL,
    "riskLevel" text DEFAULT 'MEDIUM'::text NOT NULL,
    "defaultProbability" double precision,
    "lastCalculated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.loan_features OWNER TO postgres;

--
-- Name: manual_review_queue; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.manual_review_queue (
    id text NOT NULL,
    "kycApplicationId" text NOT NULL,
    reason text NOT NULL,
    details text,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    resolution text,
    "resolutionNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.manual_review_queue OWNER TO postgres;

--
-- Name: nlu_queries; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.nlu_queries (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text,
    "rawQuestion" text NOT NULL,
    intent text,
    "extractedEntities" jsonb,
    "generatedSql" text,
    "queryResult" jsonb,
    response text,
    "processingTimeMs" integer,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.nlu_queries OWNER TO postgres;

--
-- Name: notification_preferences; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.notification_preferences (
    id text NOT NULL,
    "userId" text NOT NULL,
    "emailNotificationsEnabled" boolean DEFAULT true NOT NULL,
    "smsNotificationsEnabled" boolean DEFAULT false NOT NULL,
    "inAppNotificationsEnabled" boolean DEFAULT true NOT NULL,
    "kycNotifications" boolean DEFAULT true NOT NULL,
    "portfolioNotifications" boolean DEFAULT true NOT NULL,
    "loanNotifications" boolean DEFAULT true NOT NULL,
    "documentNotifications" boolean DEFAULT true NOT NULL,
    "systemNotifications" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.notification_preferences OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.notifications (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    type auth."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    description text,
    "relatedEntityType" text,
    "relatedEntityId" text,
    "actionUrl" text,
    status auth."NotificationStatus" DEFAULT 'UNREAD'::auth."NotificationStatus" NOT NULL,
    priority text DEFAULT 'NORMAL'::text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone,
    "archivedAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "emailSent" boolean DEFAULT false NOT NULL,
    "smsSent" boolean DEFAULT false NOT NULL
);


ALTER TABLE auth.notifications OWNER TO postgres;

--
-- Name: ocr_extractions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.ocr_extractions (
    id text NOT NULL,
    "kycApplicationId" text NOT NULL,
    "documentType" text NOT NULL,
    "rawText" text NOT NULL,
    "extractedFields" jsonb NOT NULL,
    "overallConfidence" double precision NOT NULL,
    "fieldConfidence" jsonb,
    "comparisonResults" jsonb,
    "matchScore" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.ocr_extractions OWNER TO postgres;

--
-- Name: ocr_results; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.ocr_results (
    id text NOT NULL,
    "kycApplicationId" text NOT NULL,
    "documentType" text NOT NULL,
    "rawOcrText" text NOT NULL,
    "extractedData" jsonb NOT NULL,
    "overallConfidence" double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.ocr_results OWNER TO postgres;

--
-- Name: permission_definitions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.permission_definitions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    resource character varying(100),
    action character varying(50),
    "isSystem" boolean DEFAULT true NOT NULL,
    category character varying(50),
    "hierarchyLevel" integer
);


ALTER TABLE auth.permission_definitions OWNER TO postgres;

--
-- Name: permission_definitions_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

CREATE SEQUENCE auth.permission_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.permission_definitions_id_seq OWNER TO postgres;

--
-- Name: permission_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: postgres
--

ALTER SEQUENCE auth.permission_definitions_id_seq OWNED BY auth.permission_definitions.id;


--
-- Name: portfolio_verifications; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.portfolio_verifications (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "userId" text NOT NULL,
    "verificationStatus" text DEFAULT 'INCOMPLETE'::text NOT NULL,
    "documentsUploaded" integer DEFAULT 0 NOT NULL,
    "documentsVerified" integer DEFAULT 0 NOT NULL,
    "documentsFlagged" integer DEFAULT 0 NOT NULL,
    "allDocumentsVerified" boolean DEFAULT false NOT NULL,
    "canProceedToLoan" boolean DEFAULT false NOT NULL,
    "loanToIncomeRatio" numeric(5,2),
    "emiToIncomeRatio" numeric(5,2),
    "incomePerDependent" numeric(12,2),
    "employmentStabilityScore" integer,
    "ageCategory" text,
    "overallRiskScore" integer,
    "riskLevel" text,
    "flagsCount" integer DEFAULT 0 NOT NULL,
    "flagDetails" jsonb,
    "adminNotes" text,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.portfolio_verifications OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.profiles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "fullName" text,
    phone text,
    address text,
    "dateOfBirth" timestamp(3) without time zone,
    "avatarUrl" text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.profiles OWNER TO postgres;

--
-- Name: role_definitions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.role_definitions (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    "hierarchyLevel" integer NOT NULL,
    "isSystem" boolean DEFAULT true NOT NULL,
    "colorCode" character varying(7),
    icon character varying(50)
);


ALTER TABLE auth.role_definitions OWNER TO postgres;

--
-- Name: role_definitions_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

CREATE SEQUENCE auth.role_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.role_definitions_id_seq OWNER TO postgres;

--
-- Name: role_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: postgres
--

ALTER SEQUENCE auth.role_definitions_id_seq OWNED BY auth.role_definitions.id;


--
-- Name: role_permissions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.role_permissions (
    id integer NOT NULL,
    "roleId" integer NOT NULL,
    "permissionId" integer NOT NULL
);


ALTER TABLE auth.role_permissions OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

CREATE SEQUENCE auth.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.role_permissions_id_seq OWNER TO postgres;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: postgres
--

ALTER SEQUENCE auth.role_permissions_id_seq OWNED BY auth.role_permissions.id;


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    "refreshTokenHash" text NOT NULL,
    "isRevoked" boolean DEFAULT false NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.sessions OWNER TO postgres;

--
-- Name: tenant_admins; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.tenant_admins (
    id integer NOT NULL,
    "tenantId" integer NOT NULL,
    "userId" text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.tenant_admins OWNER TO postgres;

--
-- Name: tenant_admins_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

CREATE SEQUENCE auth.tenant_admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.tenant_admins_id_seq OWNER TO postgres;

--
-- Name: tenant_admins_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: postgres
--

ALTER SEQUENCE auth.tenant_admins_id_seq OWNED BY auth.tenant_admins.id;


--
-- Name: tenants; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.tenants (
    id integer NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    domain text,
    "companyType" character varying(50),
    "panNumber" character varying(10),
    "logoUrl" character varying(500),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" integer,
    "subscriptionTier" character varying(50),
    "maxUsers" integer DEFAULT 100 NOT NULL,
    "maxLoans" integer DEFAULT 1000 NOT NULL,
    "usageLoans" integer DEFAULT 0 NOT NULL,
    "usageUsers" integer DEFAULT 0 NOT NULL,
    "lastActivity" timestamp(3) without time zone,
    "featureMlScoring" boolean DEFAULT true NOT NULL,
    "featureAuditLogs" boolean DEFAULT true NOT NULL,
    "featureApiAccess" boolean DEFAULT true NOT NULL,
    "featureCustomWorkflows" boolean DEFAULT false NOT NULL,
    "dataResidency" character varying(50),
    "encryptionEnabled" boolean DEFAULT true NOT NULL
);


ALTER TABLE auth.tenants OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

CREATE SEQUENCE auth.tenants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.tenants_id_seq OWNER TO postgres;

--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: postgres
--

ALTER SEQUENCE auth.tenants_id_seq OWNED BY auth.tenants.id;


--
-- Name: transactions; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.transactions (
    id text NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "bankStatementId" text NOT NULL,
    "userId" text NOT NULL,
    "transactionDate" timestamp(3) without time zone NOT NULL,
    description text,
    debit numeric(15,2),
    credit numeric(15,2),
    balance numeric(15,2),
    "transactionType" text,
    category text,
    "confidenceScore" double precision DEFAULT 1.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE auth.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.users (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "tenantId" integer DEFAULT 1 NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.users OWNER TO postgres;

--
-- Name: verification_reports; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.verification_reports (
    id text NOT NULL,
    "kycApplicationId" text NOT NULL,
    "faceSimilarity" double precision,
    "ocrConfidence" double precision,
    "fieldsCorrected" integer DEFAULT 0 NOT NULL,
    "possibleMismatches" jsonb,
    "manualReviewSuggested" boolean DEFAULT false NOT NULL,
    report text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE auth.verification_reports OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: feature_toggles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feature_toggles (
    id integer NOT NULL,
    "tenantId" integer NOT NULL,
    "featureName" character varying(100) NOT NULL,
    "isEnabled" boolean DEFAULT false NOT NULL,
    "enabledBy" integer,
    "enabledAt" timestamp(3) without time zone,
    "metadataJson" text
);


ALTER TABLE public.feature_toggles OWNER TO postgres;

--
-- Name: feature_toggles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feature_toggles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feature_toggles_id_seq OWNER TO postgres;

--
-- Name: feature_toggles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feature_toggles_id_seq OWNED BY public.feature_toggles.id;


--
-- Name: supercontroller; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supercontroller (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    "fullName" character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL
);


ALTER TABLE public.supercontroller OWNER TO postgres;

--
-- Name: supercontroller_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supercontroller_audit_logs (
    id integer NOT NULL,
    "supercontrollerId" integer,
    action character varying(100) NOT NULL,
    "targetType" character varying(50),
    "targetId" character varying(255),
    "changesJson" text,
    "ipAddress" character varying(45),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.supercontroller_audit_logs OWNER TO postgres;

--
-- Name: supercontroller_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supercontroller_audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supercontroller_audit_logs_id_seq OWNER TO postgres;

--
-- Name: supercontroller_audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supercontroller_audit_logs_id_seq OWNED BY public.supercontroller_audit_logs.id;


--
-- Name: supercontroller_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supercontroller_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supercontroller_id_seq OWNER TO postgres;

--
-- Name: supercontroller_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supercontroller_id_seq OWNED BY public.supercontroller.id;


--
-- Name: tenant_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenant_metrics (
    id integer NOT NULL,
    "tenantId" integer NOT NULL,
    "metricDate" date NOT NULL,
    "totalUsers" integer,
    "totalLoans" integer,
    "totalRevenue" numeric(12,2),
    "apiCalls" integer,
    "errorRate" numeric(5,2),
    "avgResponseTimeMs" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.tenant_metrics OWNER TO postgres;

--
-- Name: tenant_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tenant_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tenant_metrics_id_seq OWNER TO postgres;

--
-- Name: tenant_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tenant_metrics_id_seq OWNED BY public.tenant_metrics.id;


--
-- Name: permission_definitions id; Type: DEFAULT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.permission_definitions ALTER COLUMN id SET DEFAULT nextval('auth.permission_definitions_id_seq'::regclass);


--
-- Name: role_definitions id; Type: DEFAULT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_definitions ALTER COLUMN id SET DEFAULT nextval('auth.role_definitions_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_permissions ALTER COLUMN id SET DEFAULT nextval('auth.role_permissions_id_seq'::regclass);


--
-- Name: tenant_admins id; Type: DEFAULT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.tenant_admins ALTER COLUMN id SET DEFAULT nextval('auth.tenant_admins_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.tenants ALTER COLUMN id SET DEFAULT nextval('auth.tenants_id_seq'::regclass);


--
-- Name: feature_toggles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_toggles ALTER COLUMN id SET DEFAULT nextval('public.feature_toggles_id_seq'::regclass);


--
-- Name: supercontroller id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supercontroller ALTER COLUMN id SET DEFAULT nextval('public.supercontroller_id_seq'::regclass);


--
-- Name: supercontroller_audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supercontroller_audit_logs ALTER COLUMN id SET DEFAULT nextval('public.supercontroller_audit_logs_id_seq'::regclass);


--
-- Name: tenant_metrics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_metrics ALTER COLUMN id SET DEFAULT nextval('public.tenant_metrics_id_seq'::regclass);


--
-- Data for Name: Role; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth."Role" (id, name, "createdAt", "updatedAt") FROM stdin;
cmui6hzl00000agv6yyj18d5m	REVIEWER	2026-09-26 09:19:48.324	2026-09-26 09:19:48.324
cmui6hzl20001agv6irq41j90	ADMIN	2026-09-26 09:19:48.326	2026-09-26 09:19:48.326
cmui6hzly0002agv60tafcwy4	USER	2026-09-26 09:19:48.358	2026-09-26 09:19:48.358
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.audit_logs (id, "tenantId", "userId", action, metadata, ip, "userAgent", "createdAt") FROM stdin;
\.


--
-- Data for Name: bank_statements; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.bank_statements (id, "tenantId", "userId", "bankName", "accountNumber", "accountHolderName", "statementFromDate", "statementToDate", "openingBalance", "closingBalance", "filePath", "fileChecksum", "parsingStatus", "errorMessage", "createdAt", "updatedAt") FROM stdin;
cmui6i4ec001wagv6po5y0zzi	2	cmui6i1ma000fagv6gd9zpz6w	Demo Bank	ACC8338230453	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.564	2026-09-26 09:19:54.564
cmui6i4gm002aagv6txujh0ci	2	cmui6i1mg000hagv6tgok8bhe	Demo Bank	ACC6351927252	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.646	2026-09-26 09:19:54.646
cmui6i4hv002nagv6nvjuiz0n	3	cmui6i1nn000pagv6r7oyn45a	Demo Bank	ACC6100157910	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.691	2026-09-26 09:19:54.691
cmui6i4j60031agv6hn67fwsp	3	cmui6i1nt000ragv65d2ih53a	Demo Bank	ACC3886570657	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.738	2026-09-26 09:19:54.738
cmui6i4kb003eagv6iwheo52o	4	cmui6i1o9000vagv68qj4c9up	Demo Bank	ACC5419530303	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.779	2026-09-26 09:19:54.779
cmui6i4lf003ragv6vp778a9o	5	cmui6i1p30011agv6hsixcijf	Demo Bank	ACC4640566043	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.819	2026-09-26 09:19:54.819
cmui6i4ml0045agv6olovmwb7	5	cmui6i1pa0013agv60btbfzt7	Demo Bank	ACC5668521793	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.861	2026-09-26 09:19:54.861
cmui6i4nn004iagv64iwbfh7b	6	cmui6i1pr0017agv6yo3cf2d5	Demo Bank	ACC3707807379	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-26 09:19:54.899	2026-09-26 09:19:54.899
\.


--
-- Data for Name: borrower_features; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.borrower_features (id, "tenantId", "userId", "amtIncomeTotal", "amtCredit", "daysBirth", "daysEmployed", "debtToIncomeRatio", "paymentConsistencyScore", "cntInstalment", "amtAnnuity", "computedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: chat_conversations; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.chat_conversations (id, "tenantId", "userId", "sessionId", messages, context, "createdAt", "updatedAt") FROM stdin;
cmui6i5nn004xagv6z3zxi22a	1	cmui6i1ki0003agv6x654ew8r	seed-demo-1	[{"role": "user", "content": "What affects my credit score?", "timestamp": "2026-09-26T09:19:56.194Z"}, {"role": "assistant", "content": "Payment history, credit utilization, and external scores (EXT_SOURCE_2/3) are the biggest drivers.", "timestamp": "2026-09-26T09:19:56.194Z"}]	\N	2026-09-26 09:19:56.195	2026-09-26 09:19:56.195
\.


--
-- Data for Name: company_invites; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.company_invites (id, "tenantId", email, role, token, status, "invitedBy", "expiresAt", "createdAt", "acceptedAt") FROM stdin;
\.


--
-- Data for Name: company_requests; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.company_requests (id, "requestedBy", "companyName", slug, "panNumber", gstin, "companyType", domain, address, "documentUrls", status, "rejectionReason", "reviewedBy", "reviewedAt", "tenantId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.document_versions (id, "documentId", "filePath", version, "createdAt") FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.documents (id, "tenantId", "userId", "kycId", "documentType", "filePath", "fileMimeType", "fileSize", "ocrStatus", "ocrConfidence", "extractedData", "ocrErrorMessage", "ocrProcessedAt", "verificationStatus", "verificationNotes", "verifiedBy", "verifiedAt", "isDeleted", version, "replacedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: employment_info; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.employment_info (id, "tenantId", "userId", "employmentStatus", "occupationJobTitle", "employerName", "employmentStartDate", "monthlyGrossIncome", "annualIncome", "dependentsCount", "businessName", "businessType", "institutionName", "educationLevel", "expectedGraduationDate", "employmentTenureMonths", "employmentTenureDays", "employmentStable", "incomeSourceType", "incomeStabilityScore", "createdAt", "updatedAt") FROM stdin;
cmui6i4bv001qagv6pah5eh7t	2	cmui6i1ma000fagv6gd9zpz6w	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.475	2026-09-26 09:19:54.475
cmui6i4fs0024agv6dvevu2w0	2	cmui6i1mg000hagv6tgok8bhe	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.617	2026-09-26 09:19:54.617
cmui6i4h5002hagv6tqzv1go1	3	cmui6i1nn000pagv6r7oyn45a	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.665	2026-09-26 09:19:54.665
cmui6i4ik002vagv6ere1xhmi	3	cmui6i1nt000ragv65d2ih53a	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.716	2026-09-26 09:19:54.716
cmui6i4jr0038agv6w8db1w32	4	cmui6i1o9000vagv68qj4c9up	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.759	2026-09-26 09:19:54.759
cmui6i4ku003lagv6zts9v6ki	5	cmui6i1p30011agv6hsixcijf	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.798	2026-09-26 09:19:54.798
cmui6i4m1003zagv6qh4jwwb9	5	cmui6i1pa0013agv60btbfzt7	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.841	2026-09-26 09:19:54.841
cmui6i4n7004cagv6chru30a8	6	cmui6i1pr0017agv6yo3cf2d5	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-26 09:19:54.883	2026-09-26 09:19:54.883
\.


--
-- Data for Name: extraction_verifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.extraction_verifications (id, "kycApplicationId", decision, "ocrConfidence", "matchScore", "autoVerified", "manualReviewAdded", "decisionDetails", "verifiedAt", "verifiedBy", locked, "createdAt") FROM stdin;
\.


--
-- Data for Name: face_verifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.face_verifications (id, "kycApplicationId", "citizenshipPhotoPath", "selfiePhotoPath", "similarityScore", status, recommendation, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: financial_documents; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.financial_documents (id, "tenantId", "userId", "documentType", "filePath", "fileMimeType", "fileSize", "originalName", "ocrStatus", "ocrData", "ocrConfidence", "ocrErrorMessage", "ocrRawText", "ocrProcessedAt", "extractedFields", "comparisonResult", "anomalyFlags", "flagCount", "verificationStatus", "adminNotes", "verifiedBy", "verifiedAt", "isExpired", "expiryDate", "isDeleted", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: financial_profiles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.financial_profiles (id, "tenantId", "userId", "totalStatements", "dateRangeStart", "dateRangeEnd", "avgMonthlyIncome", "avgMonthlyExpense", "totalIncome", "totalExpense", "totalSavings", "savingsRate", "debtToIncomeRatio", "incomeStabilityScore", "creditScoreEstimate", "lastUpdated") FROM stdin;
cmui6i4c9001ragv6jgti1h81	2	cmui6i1ma000fagv6gd9zpz6w	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.489
cmui6i4fw0025agv6m85o9nc1	2	cmui6i1mg000hagv6tgok8bhe	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.62
cmui6i4h9002iagv6qemfyzyl	3	cmui6i1nn000pagv6r7oyn45a	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.669
cmui6i4in002wagv643d18mhx	3	cmui6i1nt000ragv65d2ih53a	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.719
cmui6i4ju0039agv6jzbhnhz3	4	cmui6i1o9000vagv68qj4c9up	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.762
cmui6i4kx003magv6x5qsg6gy	5	cmui6i1p30011agv6hsixcijf	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.801
cmui6i4m30040agv6qj2zlfsw	5	cmui6i1pa0013agv60btbfzt7	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.843
cmui6i4n9004dagv692ii1tx8	6	cmui6i1pr0017agv6yo3cf2d5	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-26 09:19:54.885
\.


--
-- Data for Name: kyc_applications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.kyc_applications (id, "tenantId", "userId", status, "submittedAt", "reviewedAt", "reviewerId", "rejectionReason", "ocrCitizenshipNumber", "ocrFullName", "ocrDateOfBirth", "ocrGender", "ocrAddress", "processingStatus", "ocrFrontStatus", "ocrBackStatus", "faceStatus", "ocrProcessingError", "faceProcessingError", "workflowStage", "faceVerificationStatus", "ocrProcessingStatus", "queuedForManualReview", "confirmedCitizenshipNumber", "confirmedFullName", "confirmedDateOfBirth", "confirmedGender", "confirmedAddress", "confirmedPhoneNumber", "confirmedEmail", "confirmedOccupation", "confirmedEmployer", "confirmedMonthlyIncome", "confirmedMaritalStatus", "confirmedEducationLevel", "createdAt", "updatedAt") FROM stdin;
cmui6i4bn001pagv65rv6dbfi	2	cmui6i1ma000fagv6gd9zpz6w	APPROVED	2026-09-21 09:19:54.461	2026-09-22 09:19:54.461	\N	\N	CIT-310324748	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-266457282	customer1	\N	\N	\N	\N	\N	\N	\N	7181.00	\N	\N	2026-09-26 09:19:54.467	2026-09-26 09:19:54.467
cmui6i4fc0022agv6an4thzs5	2	cmui6i1mg000hagv6tgok8bhe	APPROVED	2026-09-21 09:19:54.596	2026-09-22 09:19:54.596	\N	\N	CIT-375410216	customer2	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-788838650	customer2	\N	\N	\N	\N	\N	\N	\N	7384.00	\N	\N	2026-09-26 09:19:54.6	2026-09-26 09:19:54.6
cmui6i4fp0023agv6mq77no1g	2	cmui6i1mg000hagv6tgok8bhe	PENDING	2026-09-26 09:19:54.613	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	PENDING	PENDING	PENDING	\N	\N	VALIDATING_FACE	PENDING	PENDING	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.613	2026-09-26 09:19:54.613
cmui6i4h2002gagv6c8rxyc2j	3	cmui6i1nn000pagv6r7oyn45a	APPROVED	2026-09-21 09:19:54.658	2026-09-22 09:19:54.658	\N	\N	CIT-632975999	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-201919362	customer1	\N	\N	\N	\N	\N	\N	\N	7354.00	\N	\N	2026-09-26 09:19:54.662	2026-09-26 09:19:54.662
cmui6i4id002tagv6popmcpn6	3	cmui6i1nt000ragv65d2ih53a	APPROVED	2026-09-21 09:19:54.705	2026-09-22 09:19:54.705	\N	\N	CIT-475706665	customer2	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-699968324	customer2	\N	\N	\N	\N	\N	\N	\N	8092.00	\N	\N	2026-09-26 09:19:54.709	2026-09-26 09:19:54.709
cmui6i4ii002uagv65lgs35ux	3	cmui6i1nt000ragv65d2ih53a	PENDING	2026-09-26 09:19:54.714	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	PENDING	PENDING	PENDING	\N	\N	VALIDATING_FACE	PENDING	PENDING	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.714	2026-09-26 09:19:54.714
cmui6i4jo0037agv6c2i9jqwq	4	cmui6i1o9000vagv68qj4c9up	APPROVED	2026-09-21 09:19:54.754	2026-09-22 09:19:54.754	\N	\N	CIT-147469778	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-993802771	customer1	\N	\N	\N	\N	\N	\N	\N	9474.00	\N	\N	2026-09-26 09:19:54.756	2026-09-26 09:19:54.756
cmui6i4kr003kagv6ywm8cax3	5	cmui6i1p30011agv6hsixcijf	APPROVED	2026-09-21 09:19:54.792	2026-09-22 09:19:54.792	\N	\N	CIT-375765476	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-458328069	customer1	\N	\N	\N	\N	\N	\N	\N	8365.00	\N	\N	2026-09-26 09:19:54.795	2026-09-26 09:19:54.795
cmui6i4lu003xagv6ui4qziob	5	cmui6i1pa0013agv60btbfzt7	APPROVED	2026-09-21 09:19:54.831	2026-09-22 09:19:54.831	\N	\N	CIT-787552256	customer2	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-434460538	customer2	\N	\N	\N	\N	\N	\N	\N	6729.00	\N	\N	2026-09-26 09:19:54.834	2026-09-26 09:19:54.834
cmui6i4lz003yagv6j51h0ujc	5	cmui6i1pa0013agv60btbfzt7	PENDING	2026-09-26 09:19:54.839	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	PENDING	PENDING	PENDING	\N	\N	VALIDATING_FACE	PENDING	PENDING	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.839	2026-09-26 09:19:54.839
cmui6i4n4004bagv639mtw343	6	cmui6i1pr0017agv6yo3cf2d5	APPROVED	2026-09-21 09:19:54.878	2026-09-22 09:19:54.878	\N	\N	CIT-587172136	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-691929427	customer1	\N	\N	\N	\N	\N	\N	\N	7696.00	\N	\N	2026-09-26 09:19:54.88	2026-09-26 09:19:54.88
cmui6i4o5004oagv6qsmfgpya	7	cmui6i3ab001fagv6zbk73bjq	APPROVED	2026-09-21 09:19:54.914	2026-09-22 09:19:54.914	\N	\N	AAAPK5055K	rajesh	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	AAAPK5055K	rajesh	\N	\N	\N	\N	\N	\N	\N	8000.00	\N	\N	2026-09-26 09:19:54.918	2026-09-26 09:19:54.918
cmui6i4ob004pagv6jvfjzco0	8	cmui6i4ar001lagv6oj8xd2ku	APPROVED	2026-09-21 09:19:54.922	2026-09-22 09:19:54.922	\N	\N	BBBPS8899L	priya	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	BBBPS8899L	priya	\N	\N	\N	\N	\N	\N	\N	8000.00	\N	\N	2026-09-26 09:19:54.923	2026-09-26 09:19:54.923
\.


--
-- Data for Name: kyc_submission_files; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.kyc_submission_files (id, "kycApplicationId", status, "snapshotData", "faceSimilarity", "faceStatusAtCreation", "ocrStatusAtCreation", "createdAt") FROM stdin;
\.


--
-- Data for Name: loan_accounts; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.loan_accounts (id, "tenantId", "userId", "loanId", "principalAmount", "outstandingBalance", "monthlyEMI", status, "startDate", "expectedEndDate", "closedAt", "isActive", "createdAt", "updatedAt") FROM stdin;
cmui6i4dw001vagv65smuhj9d	2	cmui6i1ma000fagv6gd9zpz6w	cmui6i4de001tagv6aq0p7jcn	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.546	\N	\N	t	2026-09-26 09:19:54.548	2026-09-26 09:19:54.548
cmui6i4gi0029agv6ygpsodav	2	cmui6i1mg000hagv6tgok8bhe	cmui6i4gb0027agv6k3xgrqpa	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.641	\N	\N	t	2026-09-26 09:19:54.642	2026-09-26 09:19:54.642
cmui6i4hr002magv69p78du6r	3	cmui6i1nn000pagv6r7oyn45a	cmui6i4hk002kagv621pwwtf8	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.686	\N	\N	t	2026-09-26 09:19:54.687	2026-09-26 09:19:54.687
cmui6i4j10030agv6de6eu3yw	3	cmui6i1nt000ragv65d2ih53a	cmui6i4it002yagv63oz500qx	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.732	\N	\N	t	2026-09-26 09:19:54.733	2026-09-26 09:19:54.733
cmui6i4k7003dagv6n08o2ads	4	cmui6i1o9000vagv68qj4c9up	cmui6i4k0003bagv6lki1p29x	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.774	\N	\N	t	2026-09-26 09:19:54.775	2026-09-26 09:19:54.775
cmui6i4lb003qagv6tr32sfpe	5	cmui6i1p30011agv6hsixcijf	cmui6i4l4003oagv65in31occ	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.814	\N	\N	t	2026-09-26 09:19:54.815	2026-09-26 09:19:54.815
cmui6i4mh0044agv6eqynd8a0	5	cmui6i1pa0013agv60btbfzt7	cmui6i4m90042agv6ombnwvn6	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.856	\N	\N	t	2026-09-26 09:19:54.857	2026-09-26 09:19:54.857
cmui6i4nj004hagv6f57f97cs	6	cmui6i1pr0017agv6yo3cf2d5	cmui6i4ne004fagv62dvbclvx	15000.00	12000.00	720.00	ACTIVE	2026-07-28 09:19:54.894	\N	\N	t	2026-09-26 09:19:54.895	2026-09-26 09:19:54.895
cmui6i4or004ragv6dcv1127g	7	cmui6i3ab001fagv6zbk73bjq	cmui6i4ok004qagv6rl2laxtx	500000.00	500000.00	10625.00	ACTIVE	2026-09-26 09:19:54.937	\N	\N	t	2026-09-26 09:19:54.939	2026-09-26 09:19:54.939
\.


--
-- Data for Name: loan_applications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.loan_applications (id, "tenantId", "userId", "requestedAmount", "tenureMonths", purpose, "calculatedEmi", status, "riskScore", "riskLevel", "loanOfficerNotes", "reviewedBy", "reviewedAt", "defaultProbability", "modelVersion", "shapValues", "featureSnapshot", "mlDecision", "creditScore", "createdAt", "updatedAt") FROM stdin;
cmui6i4de001tagv6aq0p7jcn	2	cmui6i1ma000fagv6gd9zpz6w	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.53	2026-09-26 09:19:54.53
cmui6i4dk001uagv6lczzac73	2	cmui6i1ma000fagv6gd9zpz6w	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.536	2026-09-26 09:19:54.536
cmui6i4gb0027agv6k3xgrqpa	2	cmui6i1mg000hagv6tgok8bhe	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.635	2026-09-26 09:19:54.635
cmui6i4gd0028agv62ehrnc1e	2	cmui6i1mg000hagv6tgok8bhe	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.637	2026-09-26 09:19:54.637
cmui6i4hk002kagv621pwwtf8	3	cmui6i1nn000pagv6r7oyn45a	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.68	2026-09-26 09:19:54.68
cmui6i4hm002lagv6uzh3eh3n	3	cmui6i1nn000pagv6r7oyn45a	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.682	2026-09-26 09:19:54.682
cmui6i4it002yagv63oz500qx	3	cmui6i1nt000ragv65d2ih53a	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.725	2026-09-26 09:19:54.725
cmui6i4iw002zagv6ftc603pl	3	cmui6i1nt000ragv65d2ih53a	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.728	2026-09-26 09:19:54.728
cmui6i4k0003bagv6lki1p29x	4	cmui6i1o9000vagv68qj4c9up	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.768	2026-09-26 09:19:54.768
cmui6i4k2003cagv6qcw8h0fx	4	cmui6i1o9000vagv68qj4c9up	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.77	2026-09-26 09:19:54.77
cmui6i4l4003oagv65in31occ	5	cmui6i1p30011agv6hsixcijf	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.808	2026-09-26 09:19:54.808
cmui6i4l7003pagv6fx1fklqg	5	cmui6i1p30011agv6hsixcijf	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.811	2026-09-26 09:19:54.811
cmui6i4m90042agv6ombnwvn6	5	cmui6i1pa0013agv60btbfzt7	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.849	2026-09-26 09:19:54.849
cmui6i4mc0043agv6dgka6zko	5	cmui6i1pa0013agv60btbfzt7	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.852	2026-09-26 09:19:54.852
cmui6i4ne004fagv62dvbclvx	6	cmui6i1pr0017agv6yo3cf2d5	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-26 09:19:54.89	2026-09-26 09:19:54.89
cmui6i4ng004gagv6rdd8rff3	6	cmui6i1pr0017agv6yo3cf2d5	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.892	2026-09-26 09:19:54.892
cmui6i4ok004qagv6rl2laxtx	7	cmui6i3ab001fagv6zbk73bjq	500000.00	60	PERSONAL	10625.00	APPROVED	30	LOW	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.932	2026-09-26 09:19:54.932
cmui6i4pa004sagv6mkqavqpn	8	cmui6i4ar001lagv6oj8xd2ku	200000.00	36	PERSONAL	5556.00	UNDER_REVIEW	\N	\N	\N	cmui6i4ah001jagv6q36k7u8o	\N	\N	\N	\N	\N	\N	\N	2026-09-26 09:19:54.958	2026-09-26 09:19:54.958
\.


--
-- Data for Name: loan_assessments; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.loan_assessments (id, "tenantId", "userId", "requestedAmount", "loanTenureMonths", "interestRateAssumed", "eligibleAmount", "maxMonthlyEmi", "recommendedTenure", "eligibilityScore", "riskLevel", recommendation, "assessmentDetails", "createdAt") FROM stdin;
cmui6i5n6004tagv65emaod6s	1	cmui6i1ki0003agv6x654ew8r	500000.00	24	10.5	500000.00	\N	\N	92	LOW	APPROVE	{"marker": "FINGUARD_DEMO_LOW", "prediction": "APPROVE", "risk_score": 720, "probability": 0.06, "credit_score": 780, "model_version": "finguard_v1.3.0"}	2026-09-26 09:19:56.178
cmui6i5n9004uagv6uwsecrfb	1	cmui6i1ki0003agv6x654ew8r	800000.00	36	10.5	500000.00	\N	\N	64	MEDIUM	MANUAL_REVIEW	{"marker": "FINGUARD_DEMO_MEDIUM", "prediction": "APPROVE", "risk_score": 520, "probability": 0.28, "credit_score": 620, "model_version": "finguard_v1.3.0"}	2026-09-26 09:19:56.181
cmui6i5nc004vagv66af8msew	1	cmui6i1ki0003agv6x654ew8r	1500000.00	48	10.5	0.00	\N	\N	21	HIGH	REJECT	{"marker": "FINGUARD_DEMO_HIGH", "prediction": "REJECT", "risk_score": 280, "probability": 0.71, "credit_score": 430, "model_version": "finguard_v1.3.0"}	2026-09-26 09:19:56.184
\.


--
-- Data for Name: loan_features; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.loan_features (id, "tenantId", "userId", "loanApplicationId", "requestedLoanAmount", "loanTenureMonths", "calculatedEMI", "daysBirth", "daysEmployed", "occupationType", "cntChildren", "creditIncomePercent", "annuityIncomePercent", "incomePerPerson", "daysEmployedPercent", "employmentStability", "ageCategory", "totalDebtObligations", "debtToIncomeRatio", "availableMonthlyCapacity", "riskScore", "riskLevel", "defaultProbability", "lastCalculated") FROM stdin;
\.


--
-- Data for Name: manual_review_queue; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.manual_review_queue (id, "kycApplicationId", reason, details, priority, status, "reviewedBy", "reviewedAt", resolution, "resolutionNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: nlu_queries; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.nlu_queries (id, "tenantId", "userId", "rawQuestion", intent, "extractedEntities", "generatedSql", "queryResult", response, "processingTimeMs", "errorMessage", "createdAt") FROM stdin;
cmui6i5nk004wagv6l1m7lxdf	1	cmui6i1ki0003agv6x654ew8r	Am I eligible for a 500000 loan?	LOAN_ELIGIBILITY	\N	\N	\N	Based on your profile you look eligible for up to 500000. Try the Risk Assessment panel for an ML score.	42	\N	2026-09-26 09:19:56.192
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.notification_preferences (id, "userId", "emailNotificationsEnabled", "smsNotificationsEnabled", "inAppNotificationsEnabled", "kycNotifications", "portfolioNotifications", "loanNotifications", "documentNotifications", "systemNotifications", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.notifications (id, "tenantId", "userId", type, title, message, description, "relatedEntityType", "relatedEntityId", "actionUrl", status, priority, metadata, "createdAt", "readAt", "archivedAt", "expiresAt", "emailSent", "smsSent") FROM stdin;
\.


--
-- Data for Name: ocr_extractions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.ocr_extractions (id, "kycApplicationId", "documentType", "rawText", "extractedFields", "overallConfidence", "fieldConfidence", "comparisonResults", "matchScore", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ocr_results; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.ocr_results (id, "kycApplicationId", "documentType", "rawOcrText", "extractedData", "overallConfidence", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: permission_definitions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.permission_definitions (id, name, description, resource, action, "isSystem", category, "hierarchyLevel") FROM stdin;
1	tenants.create	Create new tenant	tenants	create	t	tenants	0
2	tenants.read	Read tenant info	tenants	read	t	tenants	0
3	tenants.update	Update tenant settings	tenants	update	t	tenants	0
4	tenants.delete	Delete tenant	tenants	delete	t	tenants	0
5	loans.read	Read loan details	loans	read	t	loans	2
6	loans.write	Apply for loan	loans	write	t	loans	3
7	loans.approve	Approve loans	loans	approve	t	loans	2
8	loans.reject	Reject loans	loans	reject	t	loans	2
9	users.read	Read users	users	read	t	users	1
10	users.write	Create/update users	users	write	t	users	1
11	users.manage	Manage users in tenant	users	manage	t	users	1
12	admin.access	Access admin dashboard	admin	access	t	audit	1
13	features.toggle	Enable/disable features	features	toggle	t	features	0
14	audit.view	View audit logs	audit	view	t	audit	1
15	audit.export	Export audit logs	audit	export	t	audit	0
\.


--
-- Data for Name: portfolio_verifications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.portfolio_verifications (id, "tenantId", "userId", "verificationStatus", "documentsUploaded", "documentsVerified", "documentsFlagged", "allDocumentsVerified", "canProceedToLoan", "loanToIncomeRatio", "emiToIncomeRatio", "incomePerDependent", "employmentStabilityScore", "ageCategory", "overallRiskScore", "riskLevel", "flagsCount", "flagDetails", "adminNotes", "reviewedBy", "reviewedAt", "lastUpdated", "createdAt", "updatedAt") FROM stdin;
cmui6i4co001sagv62n8mkv12	2	cmui6i1ma000fagv6gd9zpz6w	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.504	2026-09-26 09:19:54.504	2026-09-26 09:19:54.504
cmui6i4fy0026agv65r7d8d6m	2	cmui6i1mg000hagv6tgok8bhe	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.622	2026-09-26 09:19:54.622	2026-09-26 09:19:54.622
cmui6i4hf002jagv6v7cbwl2z	3	cmui6i1nn000pagv6r7oyn45a	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.675	2026-09-26 09:19:54.675	2026-09-26 09:19:54.675
cmui6i4ip002xagv6t1nu1a33	3	cmui6i1nt000ragv65d2ih53a	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.721	2026-09-26 09:19:54.721	2026-09-26 09:19:54.721
cmui6i4jw003aagv64fqu2rdr	4	cmui6i1o9000vagv68qj4c9up	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.764	2026-09-26 09:19:54.764	2026-09-26 09:19:54.764
cmui6i4l0003nagv61h6dafdc	5	cmui6i1p30011agv6hsixcijf	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.804	2026-09-26 09:19:54.804	2026-09-26 09:19:54.804
cmui6i4m60041agv6tmlz4krw	5	cmui6i1pa0013agv60btbfzt7	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.846	2026-09-26 09:19:54.846	2026-09-26 09:19:54.846
cmui6i4nb004eagv6exourhch	6	cmui6i1pr0017agv6yo3cf2d5	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-26 09:19:54.887	2026-09-26 09:19:54.887	2026-09-26 09:19:54.887
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.profiles (id, "userId", "fullName", phone, address, "dateOfBirth", "avatarUrl", "updatedAt") FROM stdin;
cmui6i1kk0004agv61e0xbexj	cmui6i1ki0003agv6x654ew8r	System Admin	+1-555-0100	\N	\N	\N	2026-09-26 09:19:50.898
cmui6i1ku0006agv6z0gvdzbh	cmui6i1kt0005agv6ac1nv5e5	KYC Reviewer	+1-555-0101	\N	\N	\N	2026-09-26 09:19:50.909
cmui6i1l30008agv6jej9bg0m	cmui6i1l10007agv6gpmau7l6	John Doe	+1-555-0102	123 Main St, Springfield	\N	\N	2026-09-26 09:19:50.918
cmui6i1lb000aagv69dnui1yp	cmui6i1la0009agv6jl6r3wtj	Acme Admin	+1-555-1001	\N	\N	\N	2026-09-26 09:19:50.926
cmui6i1lr000cagv6j7idzgra	cmui6i1lq000bagv6d3e3o1h8	Acme Approver	+1-555-1002	\N	\N	\N	2026-09-26 09:19:50.942
cmui6i1m1000eagv69vv15g2f	cmui6i1m0000dagv63o7unng3	Acme Validator	+1-555-1003	\N	\N	\N	2026-09-26 09:19:50.952
cmui6i1mb000gagv6cm3djtpu	cmui6i1ma000fagv6gd9zpz6w	Alice Acme	+1-555-1004	\N	\N	\N	2026-09-26 09:19:50.962
cmui6i1mh000iagv6hlgwynz7	cmui6i1mg000hagv6tgok8bhe	Bob Acme	+1-555-1005	\N	\N	\N	2026-09-26 09:19:50.968
cmui6i1mn000kagv6pn5umyif	cmui6i1mn000jagv6i7cv7a9i	Eve Acme	+1-555-1006	\N	\N	\N	2026-09-26 09:19:50.975
cmui6i1mt000magv6h6qpy4ym	cmui6i1ms000lagv6eo6l77zl	Globe Admin	+1-555-2001	\N	\N	\N	2026-09-26 09:19:50.98
cmui6i1n3000oagv67454k2mi	cmui6i1n2000nagv6drbzn9ce	Globe Approver	+1-555-2002	\N	\N	\N	2026-09-26 09:19:50.99
cmui6i1no000qagv6i6aemnkc	cmui6i1nn000pagv6r7oyn45a	Clara Globe	+1-555-2003	\N	\N	\N	2026-09-26 09:19:51.011
cmui6i1nu000sagv62no120bz	cmui6i1nt000ragv65d2ih53a	David Globe	+1-555-2004	\N	\N	\N	2026-09-26 09:19:51.017
cmui6i1o0000uagv6llgxor2q	cmui6i1nz000tagv6e82aqt2l	FastCredit Admin	+1-555-3001	\N	\N	\N	2026-09-26 09:19:51.023
cmui6i1ob000wagv6k6ikkopb	cmui6i1o9000vagv68qj4c9up	Fiona Fast	+1-555-3002	\N	\N	\N	2026-09-26 09:19:51.033
cmui6i1oh000yagv6s17ijm1q	cmui6i1og000xagv6y56nyaza	Everest Admin	+1-555-4001	\N	\N	\N	2026-09-26 09:19:51.04
cmui6i1ou0010agv62lnw7avz	cmui6i1ot000zagv6y69cicmy	Everest Approver	+1-555-4002	\N	\N	\N	2026-09-26 09:19:51.053
cmui6i1p40012agv6t9r6pc0q	cmui6i1p30011agv6hsixcijf	Eva Everest	+1-555-4003	\N	\N	\N	2026-09-26 09:19:51.063
cmui6i1pb0014agv64zxq8ztu	cmui6i1pa0013agv60btbfzt7	Sam Everest	+1-555-4004	\N	\N	\N	2026-09-26 09:19:51.07
cmui6i1ph0016agv61d5cg791	cmui6i1pg0015agv6xrgxnz8p	Himalayan Admin	+1-555-5001	\N	\N	\N	2026-09-26 09:19:51.076
cmui6i1ps0018agv6x6usobgn	cmui6i1pr0017agv6yo3cf2d5	Hari Himalayan	+1-555-5002	\N	\N	\N	2026-09-26 09:19:51.087
cmui6i29t001aagv6xek5tdzn	cmui6i29s0019agv6jdu7181p	HDFC Admin	+91-555-6001	\N	\N	\N	2026-09-26 09:19:51.808
cmui6i2s0001cagv665niurwx	cmui6i2rz001bagv6yksu1hwd	HDFC Reviewer	+91-555-6002	\N	\N	\N	2026-09-26 09:19:52.463
cmui6i3a3001eagv6u1ytxa42	cmui6i3a2001dagv6ln28k7te	HDFC Approver	+91-555-6003	\N	\N	\N	2026-09-26 09:19:53.114
cmui6i3ac001gagv6mlp1pz5a	cmui6i3ab001fagv6zbk73bjq	Rajesh Kumar	+919876543210	\N	\N	\N	2026-09-26 09:19:53.123
cmui6i3sg001iagv6i616kojs	cmui6i3sf001hagv6yxzbqwq3	Bajaj Admin	+91-555-7001	\N	\N	\N	2026-09-26 09:19:53.775
cmui6i4aj001kagv6qej6rouq	cmui6i4ah001jagv6q36k7u8o	Bajaj Reviewer	+91-555-7002	\N	\N	\N	2026-09-26 09:19:54.425
cmui6i4as001magv6shg0tnst	cmui6i4ar001lagv6oj8xd2ku	Priya Singh	+919876543211	\N	\N	\N	2026-09-26 09:19:54.435
cmui6i4ay001oagv6r1pe9w2x	cmui6i4ax001nagv6jco5kqzr	Tata Admin	+91-555-8001	\N	\N	\N	2026-09-26 09:19:54.441
\.


--
-- Data for Name: role_definitions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.role_definitions (id, name, description, "hierarchyLevel", "isSystem", "colorCode", icon) FROM stdin;
1	Supercontroller	Platform super admin	0	t	#000000	shield-admin
2	TenantAdmin	Tenant administrator	1	t	#0066cc	building
3	Admin	System admin (legacy)	0	t	#1a1a1a	shield
4	LoanApprover	Loan approver	2	t	#0099cc	check-circle
5	Validator	KYC/Documents validator	2	t	#6600cc	briefcase
6	Employee	Tenant employee	2	t	#6600cc	briefcase
7	Customer	End customer	3	t	#00cc66	user
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.role_permissions (id, "roleId", "permissionId") FROM stdin;
1	1	1
2	1	2
3	1	3
4	1	4
5	1	13
6	1	14
7	1	15
8	1	12
9	1	9
10	1	10
11	1	11
12	1	5
13	1	6
14	1	7
15	1	8
16	2	2
17	2	3
18	2	9
19	2	10
20	2	11
21	2	5
22	2	7
23	2	8
24	2	14
25	2	12
26	3	12
27	3	9
28	3	10
29	3	5
30	3	6
31	3	7
32	3	8
33	3	14
34	4	5
35	4	7
36	4	8
37	4	9
38	4	14
39	5	5
40	5	9
41	5	14
42	6	5
43	6	9
44	7	5
45	7	6
46	7	9
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.sessions (id, "userId", "refreshTokenHash", "isRevoked", "expiresAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: tenant_admins; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.tenant_admins (id, "tenantId", "userId", email, "createdAt") FROM stdin;
1	2	cmui6i1la0009agv6jl6r3wtj	admin@acme.finguard.test	2026-09-26 09:19:50.935
2	2	cmui6i1lq000bagv6d3e3o1h8	approver@acme.finguard.test	2026-09-26 09:19:50.947
3	2	cmui6i1m0000dagv63o7unng3	validator@acme.finguard.test	2026-09-26 09:19:50.958
4	3	cmui6i1ms000lagv6eo6l77zl	admin@globebank.finguard.test	2026-09-26 09:19:50.986
5	3	cmui6i1n2000nagv6drbzn9ce	approver@globebank.finguard.test	2026-09-26 09:19:50.995
6	4	cmui6i1nz000tagv6e82aqt2l	admin@fastcredit.finguard.test	2026-09-26 09:19:51.028
7	5	cmui6i1og000xagv6y56nyaza	admin@everest.finguard.test	2026-09-26 09:19:51.046
8	5	cmui6i1ot000zagv6y69cicmy	approver@everest.finguard.test	2026-09-26 09:19:51.058
9	6	cmui6i1pg0015agv6xrgxnz8p	admin@himalayan.finguard.test	2026-09-26 09:19:51.082
10	7	cmui6i29s0019agv6jdu7181p	admin@hdfc.finguard.local	2026-09-26 09:19:51.814
11	7	cmui6i2rz001bagv6yksu1hwd	reviewer@hdfc.finguard.local	2026-09-26 09:19:52.468
12	7	cmui6i3a2001dagv6ln28k7te	approver@hdfc.finguard.local	2026-09-26 09:19:53.119
13	8	cmui6i3sf001hagv6yxzbqwq3	admin@bajaj.finguard.local	2026-09-26 09:19:53.779
14	8	cmui6i4ah001jagv6q36k7u8o	reviewer@bajaj.finguard.local	2026-09-26 09:19:54.431
15	9	cmui6i4ax001nagv6jco5kqzr	admin@tata.finguard.local	2026-09-26 09:19:54.446
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.tenants (id, slug, name, domain, "companyType", "panNumber", "logoUrl", status, "createdAt", "createdBy", "subscriptionTier", "maxUsers", "maxLoans", "usageLoans", "usageUsers", "lastActivity", "featureMlScoring", "featureAuditLogs", "featureApiAccess", "featureCustomWorkflows", "dataResidency", "encryptionEnabled") FROM stdin;
1	default	Default Tenant	default.finguard.local	fintech	AAAAA0000A	/images/logo512.png	active	2026-09-26 09:19:49.806	\N	professional	500	10000	0	3	2026-09-26 09:19:55.113	t	t	t	f	\N	t
2	finguard-acme	Acme Financial Corporation	acme.finguard.local	bank	ABCDE1234F	/images/tenants/acme.png	active	2026-09-26 09:19:49.815	\N	enterprise	500	10000	4	6	2026-09-26 09:19:55.268	t	t	t	f	\N	t
3	finguard-globebank	GlobeBank	globebank.finguard.local	bank	FGHIJ5678K	/images/tenants/globe.png	active	2026-09-26 09:19:49.818	\N	enterprise	1000	50000	4	4	2026-09-26 09:19:55.402	t	t	t	f	\N	t
4	finguard-fastcredit	FastCredit Fintech	fastcredit.finguard.local	fintech	KLMNO9012P	/images/tenants/fast.png	active	2026-09-26 09:19:49.821	\N	basic	100	1000	2	2	2026-09-26 09:19:55.572	t	t	t	f	\N	t
5	finguard-everest	Everest Credit Union	everest.finguard.local	credit-union	QRSTU3456V	/images/tenants/everest.png	active	2026-09-26 09:19:49.824	\N	professional	300	5000	4	4	2026-09-26 09:19:55.712	t	t	t	f	\N	t
6	finguard-himalayan	Himalayan Microfinance	himalayan.finguard.local	microfinance	WXYZA7890B	/images/tenants/hima.png	active	2026-09-26 09:19:49.827	\N	basic	150	2000	2	2	2026-09-26 09:19:55.839	t	t	t	f	\N	t
7	hdfc	HDFC Bank	hdfc.finguard.local	bank	AAAHF0001H	https://via.placeholder.com/200?text=HDFC	active	2026-09-26 09:19:49.831	\N	enterprise	500	10000	1	4	2026-09-26 09:19:55.962	t	t	t	f	\N	t
8	bajaj	Bajaj Finserv	bajaj.finguard.local	fintech	AAABJ0002B	https://via.placeholder.com/200?text=Bajaj	active	2026-09-26 09:19:49.835	\N	enterprise	500	10000	1	3	2026-09-26 09:19:56.065	t	t	t	f	\N	t
9	tata	Tata Capital	tata.finguard.local	fintech	AAATC0003T	https://via.placeholder.com/200?text=Tata	active	2026-09-26 09:19:49.839	\N	professional	300	5000	0	1	2026-09-26 09:19:56.167	t	t	t	f	\N	t
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.transactions (id, "tenantId", "bankStatementId", "userId", "transactionDate", description, debit, credit, balance, "transactionType", category, "confidenceScore", "createdAt") FROM stdin;
cmui6i4ei001xagv6nlpr5daf	2	cmui6i4ec001wagv6po5y0zzi	cmui6i1ma000fagv6gd9zpz6w	2026-09-26 09:19:54.568	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.57
cmui6i4es001yagv6uj77ti6z	2	cmui6i4ec001wagv6po5y0zzi	cmui6i1ma000fagv6gd9zpz6w	2026-09-19 09:19:54.568	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.58
cmui6i4ev001zagv65ak3cpfe	2	cmui6i4ec001wagv6po5y0zzi	cmui6i1ma000fagv6gd9zpz6w	2026-09-12 09:19:54.568	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.583
cmui6i4f00020agv6al2896va	2	cmui6i4ec001wagv6po5y0zzi	cmui6i1ma000fagv6gd9zpz6w	2026-09-05 09:19:54.568	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.588
cmui6i4f40021agv62y4c4hwm	2	cmui6i4ec001wagv6po5y0zzi	cmui6i1ma000fagv6gd9zpz6w	2026-08-29 09:19:54.568	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.592
cmui6i4gp002bagv6j9asd33w	2	cmui6i4gm002aagv6txujh0ci	cmui6i1mg000hagv6tgok8bhe	2026-09-26 09:19:54.648	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.649
cmui6i4gr002cagv6cpe98aa6	2	cmui6i4gm002aagv6txujh0ci	cmui6i1mg000hagv6tgok8bhe	2026-09-19 09:19:54.648	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.651
cmui6i4gt002dagv6qr1vr617	2	cmui6i4gm002aagv6txujh0ci	cmui6i1mg000hagv6tgok8bhe	2026-09-12 09:19:54.648	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.653
cmui6i4gu002eagv6fej7yl41	2	cmui6i4gm002aagv6txujh0ci	cmui6i1mg000hagv6tgok8bhe	2026-09-05 09:19:54.648	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.654
cmui6i4gw002fagv61xkjrpp1	2	cmui6i4gm002aagv6txujh0ci	cmui6i1mg000hagv6tgok8bhe	2026-08-29 09:19:54.648	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.656
cmui6i4hx002oagv6bwx3ay8k	3	cmui6i4hv002nagv6nvjuiz0n	cmui6i1nn000pagv6r7oyn45a	2026-09-26 09:19:54.692	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.693
cmui6i4hz002pagv6y9g6pf7f	3	cmui6i4hv002nagv6nvjuiz0n	cmui6i1nn000pagv6r7oyn45a	2026-09-19 09:19:54.692	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.695
cmui6i4i1002qagv6zg8zez4n	3	cmui6i4hv002nagv6nvjuiz0n	cmui6i1nn000pagv6r7oyn45a	2026-09-12 09:19:54.692	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.697
cmui6i4i3002ragv6ojuxq8qy	3	cmui6i4hv002nagv6nvjuiz0n	cmui6i1nn000pagv6r7oyn45a	2026-09-05 09:19:54.692	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.699
cmui6i4i5002sagv6bn3hubah	3	cmui6i4hv002nagv6nvjuiz0n	cmui6i1nn000pagv6r7oyn45a	2026-08-29 09:19:54.692	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.702
cmui6i4j90032agv6bnn30l45	3	cmui6i4j60031agv6hn67fwsp	cmui6i1nt000ragv65d2ih53a	2026-09-26 09:19:54.74	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.741
cmui6i4jb0033agv6ep5n65at	3	cmui6i4j60031agv6hn67fwsp	cmui6i1nt000ragv65d2ih53a	2026-09-19 09:19:54.74	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.743
cmui6i4jd0034agv673r1f0lm	3	cmui6i4j60031agv6hn67fwsp	cmui6i1nt000ragv65d2ih53a	2026-09-12 09:19:54.74	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.745
cmui6i4jf0035agv6dejeirre	3	cmui6i4j60031agv6hn67fwsp	cmui6i1nt000ragv65d2ih53a	2026-09-05 09:19:54.74	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.747
cmui6i4ji0036agv6784jc6hc	3	cmui6i4j60031agv6hn67fwsp	cmui6i1nt000ragv65d2ih53a	2026-08-29 09:19:54.74	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.75
cmui6i4kd003fagv624guqzhu	4	cmui6i4kb003eagv6iwheo52o	cmui6i1o9000vagv68qj4c9up	2026-09-26 09:19:54.78	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.781
cmui6i4kf003gagv6elu3iso4	4	cmui6i4kb003eagv6iwheo52o	cmui6i1o9000vagv68qj4c9up	2026-09-19 09:19:54.78	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.783
cmui6i4kh003hagv6wlsmvjdu	4	cmui6i4kb003eagv6iwheo52o	cmui6i1o9000vagv68qj4c9up	2026-09-12 09:19:54.78	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.785
cmui6i4kj003iagv6blwqkbbo	4	cmui6i4kb003eagv6iwheo52o	cmui6i1o9000vagv68qj4c9up	2026-09-05 09:19:54.78	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.788
cmui6i4kl003jagv69judipu0	4	cmui6i4kb003eagv6iwheo52o	cmui6i1o9000vagv68qj4c9up	2026-08-29 09:19:54.78	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.789
cmui6i4lh003sagv6i6726f88	5	cmui6i4lf003ragv6vp778a9o	cmui6i1p30011agv6hsixcijf	2026-09-26 09:19:54.82	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.821
cmui6i4lj003tagv6jmle5w1u	5	cmui6i4lf003ragv6vp778a9o	cmui6i1p30011agv6hsixcijf	2026-09-19 09:19:54.82	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.823
cmui6i4ll003uagv6aevrl72w	5	cmui6i4lf003ragv6vp778a9o	cmui6i1p30011agv6hsixcijf	2026-09-12 09:19:54.82	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.825
cmui6i4lm003vagv6iyz600t1	5	cmui6i4lf003ragv6vp778a9o	cmui6i1p30011agv6hsixcijf	2026-09-05 09:19:54.82	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.826
cmui6i4lo003wagv6ym8spmdc	5	cmui6i4lf003ragv6vp778a9o	cmui6i1p30011agv6hsixcijf	2026-08-29 09:19:54.82	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.828
cmui6i4mp0046agv65xfk2exf	5	cmui6i4ml0045agv6olovmwb7	cmui6i1pa0013agv60btbfzt7	2026-09-26 09:19:54.864	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.865
cmui6i4ms0047agv6tittu03q	5	cmui6i4ml0045agv6olovmwb7	cmui6i1pa0013agv60btbfzt7	2026-09-19 09:19:54.864	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.868
cmui6i4mu0048agv6zef1vc9q	5	cmui6i4ml0045agv6olovmwb7	cmui6i1pa0013agv60btbfzt7	2026-09-12 09:19:54.864	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.87
cmui6i4mw0049agv6sia6oquc	5	cmui6i4ml0045agv6olovmwb7	cmui6i1pa0013agv60btbfzt7	2026-09-05 09:19:54.864	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.872
cmui6i4my004aagv6wgv411ze	5	cmui6i4ml0045agv6olovmwb7	cmui6i1pa0013agv60btbfzt7	2026-08-29 09:19:54.864	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.874
cmui6i4nq004jagv6wcuas7ql	6	cmui6i4nn004iagv64iwbfh7b	cmui6i1pr0017agv6yo3cf2d5	2026-09-26 09:19:54.901	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-26 09:19:54.902
cmui6i4nt004kagv6sn9vpe3f	6	cmui6i4nn004iagv64iwbfh7b	cmui6i1pr0017agv6yo3cf2d5	2026-09-19 09:19:54.901	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-26 09:19:54.905
cmui6i4nv004lagv6v6bpbxvr	6	cmui6i4nn004iagv64iwbfh7b	cmui6i1pr0017agv6yo3cf2d5	2026-09-12 09:19:54.901	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-26 09:19:54.907
cmui6i4nx004magv6t97rvl7w	6	cmui6i4nn004iagv64iwbfh7b	cmui6i1pr0017agv6yo3cf2d5	2026-09-05 09:19:54.901	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-26 09:19:54.909
cmui6i4nz004nagv6f9zk0cm4	6	cmui6i4nn004iagv64iwbfh7b	cmui6i1pr0017agv6yo3cf2d5	2026-08-29 09:19:54.901	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-26 09:19:54.911
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.users (id, email, "passwordHash", "isVerified", "isDeleted", "tenantId", "roleId", "createdAt", "updatedAt") FROM stdin;
cmui6i1ki0003agv6x654ew8r	admin@finguard.local	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	1	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:50.898	2026-09-26 09:19:50.898
cmui6i1kt0005agv6ac1nv5e5	reviewer@finguard.local	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	1	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:50.909	2026-09-26 09:19:50.909
cmui6i1l10007agv6gpmau7l6	user@finguard.local	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	1	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:50.918	2026-09-26 09:19:50.918
cmui6i1la0009agv6jl6r3wtj	admin@acme.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	2	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:50.926	2026-09-26 09:19:50.926
cmui6i1lq000bagv6d3e3o1h8	approver@acme.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	2	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:50.942	2026-09-26 09:19:50.942
cmui6i1m0000dagv63o7unng3	validator@acme.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	2	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:50.952	2026-09-26 09:19:50.952
cmui6i1ma000fagv6gd9zpz6w	customer1@acme.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	2	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:50.962	2026-09-26 09:19:50.962
cmui6i1mg000hagv6tgok8bhe	customer2@acme.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	2	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:50.968	2026-09-26 09:19:50.968
cmui6i1mn000jagv6i7cv7a9i	employee@acme.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	2	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:50.975	2026-09-26 09:19:50.975
cmui6i1ms000lagv6eo6l77zl	admin@globebank.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	3	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:50.98	2026-09-26 09:19:50.98
cmui6i1n2000nagv6drbzn9ce	approver@globebank.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	3	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:50.99	2026-09-26 09:19:50.99
cmui6i1nn000pagv6r7oyn45a	customer1@globebank.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	3	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:51.011	2026-09-26 09:19:51.011
cmui6i1nt000ragv65d2ih53a	customer2@globebank.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	3	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:51.017	2026-09-26 09:19:51.017
cmui6i1nz000tagv6e82aqt2l	admin@fastcredit.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	4	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:51.023	2026-09-26 09:19:51.023
cmui6i1o9000vagv68qj4c9up	customer1@fastcredit.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	4	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:51.033	2026-09-26 09:19:51.033
cmui6i1og000xagv6y56nyaza	admin@everest.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	5	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:51.04	2026-09-26 09:19:51.04
cmui6i1ot000zagv6y69cicmy	approver@everest.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	5	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:51.053	2026-09-26 09:19:51.053
cmui6i1p30011agv6hsixcijf	customer1@everest.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	5	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:51.063	2026-09-26 09:19:51.063
cmui6i1pa0013agv60btbfzt7	customer2@everest.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	5	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:51.07	2026-09-26 09:19:51.07
cmui6i1pg0015agv6xrgxnz8p	admin@himalayan.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	6	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:51.076	2026-09-26 09:19:51.076
cmui6i1pr0017agv6yo3cf2d5	customer1@himalayan.finguard.test	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	6	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:51.087	2026-09-26 09:19:51.087
cmui6i29s0019agv6jdu7181p	admin@hdfc.finguard.local	$2b$12$fUjOcyHoJ8D.gIAiz/d8HeIMCR0KBO88S9WYb6/A.9OYko9ZQWHTm	t	f	7	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:51.808	2026-09-26 09:19:51.808
cmui6i2rz001bagv6yksu1hwd	reviewer@hdfc.finguard.local	$2b$12$293uGxAnINyqAuUoiTKhwumX04lY7MHFlGpBDZMYq.3AmBFmiPRr.	t	f	7	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:52.463	2026-09-26 09:19:52.463
cmui6i3a2001dagv6ln28k7te	approver@hdfc.finguard.local	$2b$12$R26KXoPki4dq4K3opYN1j.CWbUuv5jQHfgQFv2dg7Y.ze98/rJRuK	t	f	7	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:53.114	2026-09-26 09:19:53.114
cmui6i3ab001fagv6zbk73bjq	rajesh@hdfc.finguard.local	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	7	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:53.123	2026-09-26 09:19:53.123
cmui6i3sf001hagv6yxzbqwq3	admin@bajaj.finguard.local	$2b$12$do6EO/IzU7qsEOoro32YEeqzIPdsFYOrB4XLGddQwtCZzbMweoOCy	t	f	8	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:53.775	2026-09-26 09:19:53.775
cmui6i4ah001jagv6q36k7u8o	reviewer@bajaj.finguard.local	$2b$12$QO9HwXceNi6IxEkYmPgQc.STna0WIPbH5uwVpnqE11XM8NPL6Du8.	t	f	8	cmui6hzl00000agv6yyj18d5m	2026-09-26 09:19:54.425	2026-09-26 09:19:54.425
cmui6i4ar001lagv6oj8xd2ku	priya@bajaj.finguard.local	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	8	cmui6hzly0002agv60tafcwy4	2026-09-26 09:19:54.435	2026-09-26 09:19:54.435
cmui6i4ax001nagv6jco5kqzr	admin@tata.finguard.local	$2b$12$KzAflmyYdQXgM8Tx8SOzlOHVTMRE2oWo8xcKwbbyXHYGf5Zoeuw5i	t	f	9	cmui6hzl20001agv6irq41j90	2026-09-26 09:19:54.441	2026-09-26 09:19:54.441
\.


--
-- Data for Name: verification_reports; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.verification_reports (id, "kycApplicationId", "faceSimilarity", "ocrConfidence", "fieldsCorrected", "possibleMismatches", "manualReviewSuggested", report, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0732b0f8-d998-48d4-9926-db571e3cbbbe	dafe0b76e6ed4a5907bd937c519dcf0021fb15ae6bddef4f805c5727cac414cd	2026-09-26 15:04:36.694541+05:45	20260926070154_baseline	\N	\N	2026-09-26 15:04:35.757879+05:45	1
\.


--
-- Data for Name: feature_toggles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_toggles (id, "tenantId", "featureName", "isEnabled", "enabledBy", "enabledAt", "metadataJson") FROM stdin;
1	1	feature_ml_scoring	t	1	2026-09-26 09:19:50.156	\N
2	1	feature_audit_logs	t	1	2026-09-26 09:19:50.163	\N
3	1	feature_api_access	t	1	2026-09-26 09:19:50.165	\N
4	1	feature_custom_workflows	t	1	2026-09-26 09:19:50.167	\N
5	2	feature_ml_scoring	t	1	2026-09-26 09:19:50.169	\N
6	2	feature_audit_logs	t	1	2026-09-26 09:19:50.172	\N
7	2	feature_api_access	t	1	2026-09-26 09:19:50.174	\N
8	2	feature_custom_workflows	t	1	2026-09-26 09:19:50.175	\N
9	3	feature_ml_scoring	t	1	2026-09-26 09:19:50.177	\N
10	3	feature_audit_logs	t	1	2026-09-26 09:19:50.178	\N
11	3	feature_api_access	t	1	2026-09-26 09:19:50.18	\N
12	3	feature_custom_workflows	t	1	2026-09-26 09:19:50.182	\N
13	4	feature_ml_scoring	t	1	2026-09-26 09:19:50.183	\N
14	4	feature_audit_logs	f	1	2026-09-26 09:19:50.185	\N
15	4	feature_api_access	f	1	2026-09-26 09:19:50.186	\N
16	4	feature_custom_workflows	f	1	2026-09-26 09:19:50.188	\N
17	5	feature_ml_scoring	t	1	2026-09-26 09:19:50.189	\N
18	5	feature_audit_logs	t	1	2026-09-26 09:19:50.191	\N
19	5	feature_api_access	t	1	2026-09-26 09:19:50.192	\N
20	5	feature_custom_workflows	t	1	2026-09-26 09:19:50.195	\N
21	6	feature_ml_scoring	t	1	2026-09-26 09:19:50.197	\N
22	6	feature_audit_logs	f	1	2026-09-26 09:19:50.199	\N
23	6	feature_api_access	f	1	2026-09-26 09:19:50.202	\N
24	6	feature_custom_workflows	f	1	2026-09-26 09:19:50.204	\N
25	7	feature_ml_scoring	t	1	2026-09-26 09:19:50.205	\N
26	7	feature_audit_logs	t	1	2026-09-26 09:19:50.207	\N
27	7	feature_api_access	t	1	2026-09-26 09:19:50.208	\N
28	7	feature_custom_workflows	t	1	2026-09-26 09:19:50.21	\N
29	8	feature_ml_scoring	t	1	2026-09-26 09:19:50.212	\N
30	8	feature_audit_logs	t	1	2026-09-26 09:19:50.213	\N
31	8	feature_api_access	t	1	2026-09-26 09:19:50.214	\N
32	8	feature_custom_workflows	t	1	2026-09-26 09:19:50.216	\N
33	9	feature_ml_scoring	t	1	2026-09-26 09:19:50.219	\N
34	9	feature_audit_logs	t	1	2026-09-26 09:19:50.221	\N
35	9	feature_api_access	t	1	2026-09-26 09:19:50.224	\N
36	9	feature_custom_workflows	t	1	2026-09-26 09:19:50.226	\N
\.


--
-- Data for Name: supercontroller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supercontroller (id, email, "passwordHash", "fullName", "createdAt", "lastLogin", status) FROM stdin;
1	admin@finguard.io	$2b$12$XIJNHMno3Vh1BmJSrKwWaOHYVL7W2Zk9Cd861l01LEaxAwF5FKrhK	FinGuard Super Admin	2026-09-26 09:19:49.786	\N	active
2	superadmin@finguard.io	$2b$12$mXDrG.1BPQbhUnazsmh9i.sjSrPkEH0v7RbicARbJPaqZRSqfViYW	Super Admin	2026-09-26 09:19:49.792	\N	active
\.


--
-- Data for Name: supercontroller_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supercontroller_audit_logs (id, "supercontrollerId", action, "targetType", "targetId", "changesJson", "ipAddress", "createdAt") FROM stdin;
\.


--
-- Data for Name: tenant_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_metrics (id, "tenantId", "metricDate", "totalUsers", "totalLoans", "totalRevenue", "apiCalls", "errorRate", "avgResponseTimeMs", "createdAt") FROM stdin;
1	1	2026-09-25	10	20	24000.00	631	0.88	94	2026-09-26 09:19:54.966
2	1	2026-09-24	17	23	27600.00	556	1.68	104	2026-09-26 09:19:54.975
3	1	2026-09-23	10	33	39600.00	751	1.64	117	2026-09-26 09:19:54.979
4	1	2026-09-22	14	34	40800.00	569	0.27	84	2026-09-26 09:19:54.982
5	1	2026-09-21	13	23	27600.00	543	0.56	118	2026-09-26 09:19:54.986
6	1	2026-09-20	10	29	34800.00	772	0.20	81	2026-09-26 09:19:54.989
7	1	2026-09-19	17	29	34800.00	577	1.00	108	2026-09-26 09:19:54.993
8	1	2026-09-18	10	24	28800.00	752	1.04	114	2026-09-26 09:19:54.999
9	1	2026-09-17	14	23	27600.00	575	1.86	84	2026-09-26 09:19:55.004
10	1	2026-09-16	16	20	24000.00	635	0.81	119	2026-09-26 09:19:55.009
11	1	2026-09-15	11	24	28800.00	735	1.39	94	2026-09-26 09:19:55.014
12	1	2026-09-14	15	33	39600.00	629	0.25	81	2026-09-26 09:19:55.018
13	1	2026-09-13	11	29	34800.00	747	0.39	94	2026-09-26 09:19:55.022
14	1	2026-09-12	11	26	31200.00	738	1.61	90	2026-09-26 09:19:55.025
15	1	2026-09-11	11	32	38400.00	655	1.44	118	2026-09-26 09:19:55.03
16	1	2026-09-10	17	30	36000.00	758	0.07	106	2026-09-26 09:19:55.034
17	1	2026-09-09	16	27	32400.00	581	0.74	116	2026-09-26 09:19:55.037
18	1	2026-09-08	11	30	36000.00	546	1.01	110	2026-09-26 09:19:55.042
19	1	2026-09-07	15	29	34800.00	523	1.81	111	2026-09-26 09:19:55.046
20	1	2026-09-06	17	31	37200.00	775	1.52	103	2026-09-26 09:19:55.05
21	1	2026-09-05	16	29	34800.00	579	0.93	85	2026-09-26 09:19:55.054
22	1	2026-09-04	10	34	40800.00	776	1.74	80	2026-09-26 09:19:55.059
23	1	2026-09-03	15	31	37200.00	759	0.98	95	2026-09-26 09:19:55.064
24	1	2026-09-02	13	32	38400.00	741	1.30	96	2026-09-26 09:19:55.071
25	1	2026-09-01	17	25	30000.00	589	1.61	110	2026-09-26 09:19:55.076
26	1	2026-08-31	17	33	39600.00	620	0.30	87	2026-09-26 09:19:55.08
27	1	2026-08-30	14	22	26400.00	721	0.46	111	2026-09-26 09:19:55.085
28	1	2026-08-29	12	25	30000.00	643	0.58	114	2026-09-26 09:19:55.09
29	1	2026-08-28	17	26	31200.00	684	1.51	119	2026-09-26 09:19:55.094
30	1	2026-08-27	10	22	26400.00	585	0.72	102	2026-09-26 09:19:55.097
31	2	2026-09-25	16	20	24000.00	581	0.44	81	2026-09-26 09:19:55.121
32	2	2026-09-24	14	29	34800.00	519	1.82	118	2026-09-26 09:19:55.125
33	2	2026-09-23	12	30	36000.00	536	0.48	82	2026-09-26 09:19:55.13
34	2	2026-09-22	13	28	33600.00	686	0.81	106	2026-09-26 09:19:55.136
35	2	2026-09-21	13	33	39600.00	723	0.78	113	2026-09-26 09:19:55.141
36	2	2026-09-20	10	24	28800.00	626	1.14	113	2026-09-26 09:19:55.145
37	2	2026-09-19	13	21	25200.00	742	1.63	101	2026-09-26 09:19:55.15
38	2	2026-09-18	13	25	30000.00	555	0.51	115	2026-09-26 09:19:55.155
39	2	2026-09-17	14	25	30000.00	730	0.95	111	2026-09-26 09:19:55.16
40	2	2026-09-16	12	28	33600.00	538	1.03	95	2026-09-26 09:19:55.164
41	2	2026-09-15	12	31	37200.00	670	0.35	97	2026-09-26 09:19:55.169
42	2	2026-09-14	14	23	27600.00	737	0.60	104	2026-09-26 09:19:55.173
43	2	2026-09-13	17	31	37200.00	647	1.71	91	2026-09-26 09:19:55.177
44	2	2026-09-12	15	25	30000.00	782	0.48	103	2026-09-26 09:19:55.188
45	2	2026-09-11	11	27	32400.00	552	1.72	92	2026-09-26 09:19:55.192
46	2	2026-09-10	16	21	25200.00	671	0.41	100	2026-09-26 09:19:55.197
47	2	2026-09-09	16	26	31200.00	700	1.28	111	2026-09-26 09:19:55.201
48	2	2026-09-08	15	20	24000.00	509	2.00	112	2026-09-26 09:19:55.207
49	2	2026-09-07	17	32	38400.00	604	0.44	112	2026-09-26 09:19:55.211
50	2	2026-09-06	12	29	34800.00	624	1.02	83	2026-09-26 09:19:55.215
51	2	2026-09-05	10	29	34800.00	795	1.47	103	2026-09-26 09:19:55.22
52	2	2026-09-04	17	21	25200.00	731	1.80	105	2026-09-26 09:19:55.225
53	2	2026-09-03	15	30	36000.00	729	0.56	90	2026-09-26 09:19:55.228
54	2	2026-09-02	11	22	26400.00	762	0.28	93	2026-09-26 09:19:55.233
55	2	2026-09-01	16	30	36000.00	767	1.91	116	2026-09-26 09:19:55.238
56	2	2026-08-31	11	21	25200.00	691	0.16	88	2026-09-26 09:19:55.243
57	2	2026-08-30	15	25	30000.00	617	0.45	101	2026-09-26 09:19:55.247
58	2	2026-08-29	13	23	27600.00	716	0.24	96	2026-09-26 09:19:55.252
59	2	2026-08-28	11	22	26400.00	714	0.35	86	2026-09-26 09:19:55.257
60	2	2026-08-27	15	23	27600.00	585	1.33	106	2026-09-26 09:19:55.262
61	3	2026-09-25	45	23	27600.00	603	1.65	90	2026-09-26 09:19:55.273
62	3	2026-09-24	54	24	28800.00	642	1.85	83	2026-09-26 09:19:55.277
63	3	2026-09-23	49	34	40800.00	552	1.15	106	2026-09-26 09:19:55.282
64	3	2026-09-22	45	29	34800.00	784	1.48	94	2026-09-26 09:19:55.286
65	3	2026-09-21	51	20	24000.00	729	0.91	104	2026-09-26 09:19:55.291
66	3	2026-09-20	45	24	28800.00	715	0.30	89	2026-09-26 09:19:55.295
67	3	2026-09-19	51	31	37200.00	771	0.34	86	2026-09-26 09:19:55.3
68	3	2026-09-18	50	21	25200.00	557	1.33	96	2026-09-26 09:19:55.305
69	3	2026-09-17	53	20	24000.00	504	0.07	113	2026-09-26 09:19:55.308
70	3	2026-09-16	45	31	37200.00	588	0.65	113	2026-09-26 09:19:55.313
71	3	2026-09-15	48	26	31200.00	563	0.36	88	2026-09-26 09:19:55.317
72	3	2026-09-14	47	34	40800.00	506	0.92	100	2026-09-26 09:19:55.321
73	3	2026-09-13	47	27	32400.00	676	0.51	87	2026-09-26 09:19:55.325
74	3	2026-09-12	46	24	28800.00	556	0.55	102	2026-09-26 09:19:55.33
75	3	2026-09-11	51	27	32400.00	710	1.10	96	2026-09-26 09:19:55.334
76	3	2026-09-10	49	26	31200.00	611	1.92	82	2026-09-26 09:19:55.338
77	3	2026-09-09	45	24	28800.00	791	1.59	84	2026-09-26 09:19:55.343
78	3	2026-09-08	49	28	33600.00	659	1.35	93	2026-09-26 09:19:55.346
79	3	2026-09-07	51	21	25200.00	719	0.45	112	2026-09-26 09:19:55.351
80	3	2026-09-06	49	30	36000.00	701	0.88	88	2026-09-26 09:19:55.356
81	3	2026-09-05	51	26	31200.00	727	0.03	119	2026-09-26 09:19:55.361
82	3	2026-09-04	45	33	39600.00	515	0.50	95	2026-09-26 09:19:55.365
83	3	2026-09-03	51	28	33600.00	677	1.66	91	2026-09-26 09:19:55.37
84	3	2026-09-02	51	31	37200.00	728	1.41	119	2026-09-26 09:19:55.376
85	3	2026-09-01	51	33	39600.00	747	1.64	80	2026-09-26 09:19:55.379
86	3	2026-08-31	51	24	28800.00	604	1.29	81	2026-09-26 09:19:55.382
87	3	2026-08-30	50	21	25200.00	761	0.41	87	2026-09-26 09:19:55.385
88	3	2026-08-29	45	24	28800.00	666	0.57	98	2026-09-26 09:19:55.388
89	3	2026-08-28	48	28	33600.00	599	0.35	97	2026-09-26 09:19:55.393
90	3	2026-08-27	51	33	39600.00	611	1.38	114	2026-09-26 09:19:55.397
91	4	2026-09-25	10	26	31200.00	614	1.49	115	2026-09-26 09:19:55.409
92	4	2026-09-24	11	27	32400.00	643	1.10	103	2026-09-26 09:19:55.413
93	4	2026-09-23	16	21	25200.00	532	1.19	100	2026-09-26 09:19:55.417
94	4	2026-09-22	13	23	27600.00	612	1.76	113	2026-09-26 09:19:55.421
95	4	2026-09-21	13	27	32400.00	678	0.70	91	2026-09-26 09:19:55.426
96	4	2026-09-20	17	31	37200.00	770	0.66	106	2026-09-26 09:19:55.43
97	4	2026-09-19	15	29	34800.00	593	0.34	89	2026-09-26 09:19:55.45
98	4	2026-09-18	11	21	25200.00	521	1.10	114	2026-09-26 09:19:55.455
99	4	2026-09-17	12	30	36000.00	731	0.95	115	2026-09-26 09:19:55.46
100	4	2026-09-16	10	28	33600.00	776	1.20	91	2026-09-26 09:19:55.466
101	4	2026-09-15	15	33	39600.00	536	1.79	105	2026-09-26 09:19:55.47
102	4	2026-09-14	15	21	25200.00	652	1.66	95	2026-09-26 09:19:55.474
103	4	2026-09-13	17	20	24000.00	680	0.50	80	2026-09-26 09:19:55.478
104	4	2026-09-12	17	33	39600.00	541	0.87	92	2026-09-26 09:19:55.482
105	4	2026-09-11	10	21	25200.00	660	0.24	116	2026-09-26 09:19:55.501
106	4	2026-09-10	14	29	34800.00	545	0.12	118	2026-09-26 09:19:55.505
107	4	2026-09-09	16	22	26400.00	681	1.53	94	2026-09-26 09:19:55.509
108	4	2026-09-08	12	28	33600.00	798	0.46	87	2026-09-26 09:19:55.514
109	4	2026-09-07	14	31	37200.00	674	1.46	117	2026-09-26 09:19:55.518
110	4	2026-09-06	15	21	25200.00	542	1.89	83	2026-09-26 09:19:55.522
111	4	2026-09-05	17	33	39600.00	629	1.32	115	2026-09-26 09:19:55.526
112	4	2026-09-04	13	21	25200.00	646	0.43	119	2026-09-26 09:19:55.531
113	4	2026-09-03	10	23	27600.00	686	0.10	116	2026-09-26 09:19:55.535
114	4	2026-09-02	11	25	30000.00	773	0.26	80	2026-09-26 09:19:55.539
115	4	2026-09-01	13	23	27600.00	715	1.38	88	2026-09-26 09:19:55.543
116	4	2026-08-31	15	26	31200.00	536	1.40	95	2026-09-26 09:19:55.55
117	4	2026-08-30	17	34	40800.00	502	1.45	82	2026-09-26 09:19:55.555
118	4	2026-08-29	14	29	34800.00	611	1.38	114	2026-09-26 09:19:55.559
119	4	2026-08-28	12	30	36000.00	740	1.32	85	2026-09-26 09:19:55.563
120	4	2026-08-27	12	24	28800.00	684	0.04	81	2026-09-26 09:19:55.567
121	5	2026-09-25	16	22	26400.00	503	1.01	105	2026-09-26 09:19:55.577
122	5	2026-09-24	15	24	28800.00	632	1.76	108	2026-09-26 09:19:55.581
123	5	2026-09-23	10	33	39600.00	593	0.97	85	2026-09-26 09:19:55.585
124	5	2026-09-22	12	31	37200.00	704	0.24	82	2026-09-26 09:19:55.589
125	5	2026-09-21	16	22	26400.00	586	0.48	84	2026-09-26 09:19:55.593
126	5	2026-09-20	17	33	39600.00	627	1.91	81	2026-09-26 09:19:55.597
127	5	2026-09-19	13	27	32400.00	662	0.04	100	2026-09-26 09:19:55.601
128	5	2026-09-18	10	23	27600.00	635	1.65	85	2026-09-26 09:19:55.605
129	5	2026-09-17	15	22	26400.00	505	0.79	104	2026-09-26 09:19:55.61
130	5	2026-09-16	15	20	24000.00	703	0.93	116	2026-09-26 09:19:55.614
131	5	2026-09-15	12	25	30000.00	714	1.67	116	2026-09-26 09:19:55.619
132	5	2026-09-14	14	33	39600.00	699	1.41	92	2026-09-26 09:19:55.623
133	5	2026-09-13	15	25	30000.00	766	0.54	105	2026-09-26 09:19:55.628
134	5	2026-09-12	10	22	26400.00	632	1.01	83	2026-09-26 09:19:55.632
135	5	2026-09-11	12	23	27600.00	709	1.57	95	2026-09-26 09:19:55.636
136	5	2026-09-10	10	28	33600.00	599	0.42	81	2026-09-26 09:19:55.64
137	5	2026-09-09	17	31	37200.00	763	1.01	100	2026-09-26 09:19:55.645
138	5	2026-09-08	14	25	30000.00	666	0.01	84	2026-09-26 09:19:55.649
139	5	2026-09-07	17	21	25200.00	592	1.71	98	2026-09-26 09:19:55.653
140	5	2026-09-06	10	26	31200.00	652	1.48	81	2026-09-26 09:19:55.657
141	5	2026-09-05	15	27	32400.00	649	0.22	99	2026-09-26 09:19:55.661
142	5	2026-09-04	13	28	33600.00	594	1.70	88	2026-09-26 09:19:55.665
143	5	2026-09-03	11	22	26400.00	578	1.00	88	2026-09-26 09:19:55.67
144	5	2026-09-02	15	21	25200.00	674	0.15	83	2026-09-26 09:19:55.677
145	5	2026-09-01	11	21	25200.00	558	0.23	115	2026-09-26 09:19:55.682
146	5	2026-08-31	10	30	36000.00	704	1.89	108	2026-09-26 09:19:55.688
147	5	2026-08-30	11	28	33600.00	718	0.93	81	2026-09-26 09:19:55.692
148	5	2026-08-29	10	22	26400.00	772	0.44	114	2026-09-26 09:19:55.696
149	5	2026-08-28	13	26	31200.00	523	0.60	100	2026-09-26 09:19:55.7
150	5	2026-08-27	10	30	36000.00	788	0.17	80	2026-09-26 09:19:55.705
151	6	2026-09-25	12	25	30000.00	628	1.60	117	2026-09-26 09:19:55.716
152	6	2026-09-24	12	23	27600.00	557	0.77	81	2026-09-26 09:19:55.721
153	6	2026-09-23	11	22	26400.00	631	1.35	90	2026-09-26 09:19:55.725
154	6	2026-09-22	17	21	25200.00	521	1.37	106	2026-09-26 09:19:55.73
155	6	2026-09-21	15	32	38400.00	652	1.45	91	2026-09-26 09:19:55.734
156	6	2026-09-20	15	34	40800.00	670	1.25	85	2026-09-26 09:19:55.738
157	6	2026-09-19	13	32	38400.00	722	0.13	119	2026-09-26 09:19:55.743
158	6	2026-09-18	14	28	33600.00	531	0.18	106	2026-09-26 09:19:55.747
159	6	2026-09-17	13	20	24000.00	614	0.31	87	2026-09-26 09:19:55.751
160	6	2026-09-16	10	20	24000.00	509	0.62	96	2026-09-26 09:19:55.755
161	6	2026-09-15	17	33	39600.00	588	1.06	106	2026-09-26 09:19:55.761
162	6	2026-09-14	10	22	26400.00	626	0.72	88	2026-09-26 09:19:55.765
163	6	2026-09-13	14	34	40800.00	684	1.16	102	2026-09-26 09:19:55.769
164	6	2026-09-12	13	31	37200.00	510	1.24	109	2026-09-26 09:19:55.773
165	6	2026-09-11	15	30	36000.00	539	0.09	111	2026-09-26 09:19:55.778
166	6	2026-09-10	14	34	40800.00	571	0.80	107	2026-09-26 09:19:55.783
167	6	2026-09-09	13	24	28800.00	787	1.97	84	2026-09-26 09:19:55.787
168	6	2026-09-08	16	20	24000.00	765	0.11	115	2026-09-26 09:19:55.791
169	6	2026-09-07	10	29	34800.00	507	0.06	102	2026-09-26 09:19:55.796
170	6	2026-09-06	14	25	30000.00	527	1.46	86	2026-09-26 09:19:55.8
171	6	2026-09-05	13	30	36000.00	691	1.25	114	2026-09-26 09:19:55.803
172	6	2026-09-04	15	29	34800.00	735	1.18	90	2026-09-26 09:19:55.806
173	6	2026-09-03	10	30	36000.00	540	1.70	88	2026-09-26 09:19:55.809
174	6	2026-09-02	14	25	30000.00	708	0.23	94	2026-09-26 09:19:55.812
175	6	2026-09-01	15	26	31200.00	503	1.66	85	2026-09-26 09:19:55.816
176	6	2026-08-31	10	30	36000.00	525	0.72	116	2026-09-26 09:19:55.819
177	6	2026-08-30	17	27	32400.00	726	0.37	114	2026-09-26 09:19:55.823
178	6	2026-08-29	13	21	25200.00	553	0.83	102	2026-09-26 09:19:55.827
179	6	2026-08-28	10	31	37200.00	591	0.66	104	2026-09-26 09:19:55.83
180	6	2026-08-27	13	20	24000.00	593	0.08	100	2026-09-26 09:19:55.834
181	7	2026-09-25	16	33	39600.00	790	0.40	109	2026-09-26 09:19:55.844
182	7	2026-09-24	15	26	31200.00	511	0.92	86	2026-09-26 09:19:55.849
183	7	2026-09-23	10	32	38400.00	523	1.43	90	2026-09-26 09:19:55.852
184	7	2026-09-22	13	33	39600.00	656	1.50	85	2026-09-26 09:19:55.856
185	7	2026-09-21	14	24	28800.00	692	0.62	103	2026-09-26 09:19:55.864
186	7	2026-09-20	17	32	38400.00	642	1.21	83	2026-09-26 09:19:55.869
187	7	2026-09-19	11	24	28800.00	534	0.21	113	2026-09-26 09:19:55.874
188	7	2026-09-18	13	25	30000.00	612	0.49	83	2026-09-26 09:19:55.877
189	7	2026-09-17	10	28	33600.00	550	0.28	112	2026-09-26 09:19:55.879
190	7	2026-09-16	12	32	38400.00	709	1.74	109	2026-09-26 09:19:55.884
191	7	2026-09-15	10	29	34800.00	756	1.99	98	2026-09-26 09:19:55.887
192	7	2026-09-14	12	29	34800.00	525	1.09	95	2026-09-26 09:19:55.891
193	7	2026-09-13	10	33	39600.00	742	0.11	99	2026-09-26 09:19:55.894
194	7	2026-09-12	12	21	25200.00	651	0.34	99	2026-09-26 09:19:55.898
195	7	2026-09-11	16	21	25200.00	525	0.11	103	2026-09-26 09:19:55.902
196	7	2026-09-10	17	20	24000.00	781	0.08	86	2026-09-26 09:19:55.907
197	7	2026-09-09	14	28	33600.00	672	0.56	108	2026-09-26 09:19:55.91
198	7	2026-09-08	12	27	32400.00	617	1.01	103	2026-09-26 09:19:55.914
199	7	2026-09-07	11	27	32400.00	741	0.19	97	2026-09-26 09:19:55.918
200	7	2026-09-06	17	25	30000.00	655	1.24	110	2026-09-26 09:19:55.922
201	7	2026-09-05	12	27	32400.00	694	0.07	110	2026-09-26 09:19:55.925
202	7	2026-09-04	16	28	33600.00	509	1.05	103	2026-09-26 09:19:55.928
203	7	2026-09-03	12	20	24000.00	734	0.05	88	2026-09-26 09:19:55.933
204	7	2026-09-02	13	24	28800.00	791	1.04	93	2026-09-26 09:19:55.937
205	7	2026-09-01	12	21	25200.00	738	1.65	90	2026-09-26 09:19:55.942
206	7	2026-08-31	10	30	36000.00	662	0.80	89	2026-09-26 09:19:55.945
207	7	2026-08-30	10	21	25200.00	773	1.81	119	2026-09-26 09:19:55.949
208	7	2026-08-29	14	24	28800.00	661	0.31	119	2026-09-26 09:19:55.952
209	7	2026-08-28	11	33	39600.00	774	1.81	117	2026-09-26 09:19:55.955
210	7	2026-08-27	11	34	40800.00	669	1.39	108	2026-09-26 09:19:55.958
211	8	2026-09-25	10	31	37200.00	677	0.41	86	2026-09-26 09:19:55.966
212	8	2026-09-24	11	22	26400.00	662	0.14	115	2026-09-26 09:19:55.97
213	8	2026-09-23	16	25	30000.00	581	1.56	93	2026-09-26 09:19:55.973
214	8	2026-09-22	16	33	39600.00	694	1.50	117	2026-09-26 09:19:55.977
215	8	2026-09-21	13	31	37200.00	759	0.85	100	2026-09-26 09:19:55.98
216	8	2026-09-20	12	22	26400.00	780	0.01	94	2026-09-26 09:19:55.984
217	8	2026-09-19	11	33	39600.00	713	1.59	102	2026-09-26 09:19:55.987
218	8	2026-09-18	14	22	26400.00	523	1.54	83	2026-09-26 09:19:55.989
219	8	2026-09-17	16	34	40800.00	590	1.26	102	2026-09-26 09:19:55.993
220	8	2026-09-16	13	27	32400.00	524	1.62	89	2026-09-26 09:19:55.996
221	8	2026-09-15	15	33	39600.00	706	0.42	112	2026-09-26 09:19:55.999
222	8	2026-09-14	17	32	38400.00	702	0.42	87	2026-09-26 09:19:56.003
223	8	2026-09-13	14	28	33600.00	641	0.14	106	2026-09-26 09:19:56.008
224	8	2026-09-12	14	27	32400.00	736	1.02	98	2026-09-26 09:19:56.011
225	8	2026-09-11	11	24	28800.00	661	0.72	100	2026-09-26 09:19:56.013
226	8	2026-09-10	11	21	25200.00	602	0.09	97	2026-09-26 09:19:56.017
227	8	2026-09-09	10	23	27600.00	678	1.46	81	2026-09-26 09:19:56.02
228	8	2026-09-08	10	24	28800.00	609	1.72	84	2026-09-26 09:19:56.023
229	8	2026-09-07	16	23	27600.00	592	1.37	118	2026-09-26 09:19:56.026
230	8	2026-09-06	16	23	27600.00	506	1.25	85	2026-09-26 09:19:56.029
231	8	2026-09-05	13	30	36000.00	643	1.24	87	2026-09-26 09:19:56.032
232	8	2026-09-04	13	26	31200.00	590	1.53	96	2026-09-26 09:19:56.036
233	8	2026-09-03	13	26	31200.00	702	1.78	85	2026-09-26 09:19:56.04
234	8	2026-09-02	16	33	39600.00	501	1.91	115	2026-09-26 09:19:56.042
235	8	2026-09-01	17	20	24000.00	793	0.97	118	2026-09-26 09:19:56.045
236	8	2026-08-31	16	29	34800.00	667	0.93	109	2026-09-26 09:19:56.048
237	8	2026-08-30	13	31	37200.00	752	0.48	96	2026-09-26 09:19:56.051
238	8	2026-08-29	16	28	33600.00	504	1.51	109	2026-09-26 09:19:56.054
239	8	2026-08-28	15	20	24000.00	560	1.99	98	2026-09-26 09:19:56.058
240	8	2026-08-27	15	34	40800.00	582	0.23	118	2026-09-26 09:19:56.061
241	9	2026-09-25	13	20	24000.00	652	1.23	83	2026-09-26 09:19:56.069
242	9	2026-09-24	11	33	39600.00	571	1.13	98	2026-09-26 09:19:56.071
243	9	2026-09-23	12	28	33600.00	786	1.68	114	2026-09-26 09:19:56.074
244	9	2026-09-22	17	24	28800.00	567	1.07	109	2026-09-26 09:19:56.077
245	9	2026-09-21	15	34	40800.00	778	0.47	84	2026-09-26 09:19:56.08
246	9	2026-09-20	14	27	32400.00	732	1.88	89	2026-09-26 09:19:56.083
247	9	2026-09-19	11	31	37200.00	665	1.09	84	2026-09-26 09:19:56.086
248	9	2026-09-18	17	29	34800.00	622	0.28	102	2026-09-26 09:19:56.089
249	9	2026-09-17	10	22	26400.00	749	1.62	98	2026-09-26 09:19:56.092
250	9	2026-09-16	17	34	40800.00	753	0.87	96	2026-09-26 09:19:56.095
251	9	2026-09-15	10	21	25200.00	516	0.60	94	2026-09-26 09:19:56.098
252	9	2026-09-14	11	31	37200.00	621	1.95	109	2026-09-26 09:19:56.102
253	9	2026-09-13	17	27	32400.00	705	1.12	99	2026-09-26 09:19:56.106
254	9	2026-09-12	16	22	26400.00	585	1.61	104	2026-09-26 09:19:56.11
255	9	2026-09-11	13	30	36000.00	537	1.61	113	2026-09-26 09:19:56.114
256	9	2026-09-10	16	26	31200.00	739	0.29	82	2026-09-26 09:19:56.119
257	9	2026-09-09	14	29	34800.00	606	1.28	111	2026-09-26 09:19:56.123
258	9	2026-09-08	14	23	27600.00	643	1.64	108	2026-09-26 09:19:56.126
259	9	2026-09-07	17	26	31200.00	525	0.57	90	2026-09-26 09:19:56.129
260	9	2026-09-06	13	30	36000.00	621	1.92	85	2026-09-26 09:19:56.132
261	9	2026-09-05	11	29	34800.00	631	0.46	108	2026-09-26 09:19:56.135
262	9	2026-09-04	15	32	38400.00	792	1.29	108	2026-09-26 09:19:56.14
263	9	2026-09-03	12	27	32400.00	691	1.50	101	2026-09-26 09:19:56.143
264	9	2026-09-02	15	27	32400.00	654	0.83	96	2026-09-26 09:19:56.146
265	9	2026-09-01	15	27	32400.00	511	0.28	96	2026-09-26 09:19:56.148
266	9	2026-08-31	13	34	40800.00	607	1.59	92	2026-09-26 09:19:56.151
267	9	2026-08-30	15	28	33600.00	654	0.33	101	2026-09-26 09:19:56.154
268	9	2026-08-29	16	33	39600.00	664	1.80	83	2026-09-26 09:19:56.157
269	9	2026-08-28	16	32	38400.00	580	0.60	100	2026-09-26 09:19:56.16
270	9	2026-08-27	16	24	28800.00	617	1.89	92	2026-09-26 09:19:56.162
\.


--
-- Name: permission_definitions_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.permission_definitions_id_seq', 15, true);


--
-- Name: role_definitions_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.role_definitions_id_seq', 7, true);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.role_permissions_id_seq', 46, true);


--
-- Name: tenant_admins_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.tenant_admins_id_seq', 15, true);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.tenants_id_seq', 9, true);


--
-- Name: feature_toggles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feature_toggles_id_seq', 36, true);


--
-- Name: supercontroller_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_audit_logs_id_seq', 1, false);


--
-- Name: supercontroller_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_id_seq', 2, true);


--
-- Name: tenant_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_metrics_id_seq', 270, true);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_statements bank_statements_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.bank_statements
    ADD CONSTRAINT bank_statements_pkey PRIMARY KEY (id);


--
-- Name: borrower_features borrower_features_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.borrower_features
    ADD CONSTRAINT borrower_features_pkey PRIMARY KEY (id);


--
-- Name: chat_conversations chat_conversations_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);


--
-- Name: company_invites company_invites_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.company_invites
    ADD CONSTRAINT company_invites_pkey PRIMARY KEY (id);


--
-- Name: company_requests company_requests_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.company_requests
    ADD CONSTRAINT company_requests_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: employment_info employment_info_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.employment_info
    ADD CONSTRAINT employment_info_pkey PRIMARY KEY (id);


--
-- Name: extraction_verifications extraction_verifications_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.extraction_verifications
    ADD CONSTRAINT extraction_verifications_pkey PRIMARY KEY (id);


--
-- Name: face_verifications face_verifications_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.face_verifications
    ADD CONSTRAINT face_verifications_pkey PRIMARY KEY (id);


--
-- Name: financial_documents financial_documents_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.financial_documents
    ADD CONSTRAINT financial_documents_pkey PRIMARY KEY (id);


--
-- Name: financial_profiles financial_profiles_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.financial_profiles
    ADD CONSTRAINT financial_profiles_pkey PRIMARY KEY (id);


--
-- Name: kyc_applications kyc_applications_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.kyc_applications
    ADD CONSTRAINT kyc_applications_pkey PRIMARY KEY (id);


--
-- Name: kyc_submission_files kyc_submission_files_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.kyc_submission_files
    ADD CONSTRAINT kyc_submission_files_pkey PRIMARY KEY (id);


--
-- Name: loan_accounts loan_accounts_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_accounts
    ADD CONSTRAINT loan_accounts_pkey PRIMARY KEY (id);


--
-- Name: loan_applications loan_applications_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_applications
    ADD CONSTRAINT loan_applications_pkey PRIMARY KEY (id);


--
-- Name: loan_assessments loan_assessments_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_assessments
    ADD CONSTRAINT loan_assessments_pkey PRIMARY KEY (id);


--
-- Name: loan_features loan_features_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_features
    ADD CONSTRAINT loan_features_pkey PRIMARY KEY (id);


--
-- Name: manual_review_queue manual_review_queue_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.manual_review_queue
    ADD CONSTRAINT manual_review_queue_pkey PRIMARY KEY (id);


--
-- Name: nlu_queries nlu_queries_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.nlu_queries
    ADD CONSTRAINT nlu_queries_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: ocr_extractions ocr_extractions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.ocr_extractions
    ADD CONSTRAINT ocr_extractions_pkey PRIMARY KEY (id);


--
-- Name: ocr_results ocr_results_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.ocr_results
    ADD CONSTRAINT ocr_results_pkey PRIMARY KEY (id);


--
-- Name: permission_definitions permission_definitions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.permission_definitions
    ADD CONSTRAINT permission_definitions_pkey PRIMARY KEY (id);


--
-- Name: portfolio_verifications portfolio_verifications_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.portfolio_verifications
    ADD CONSTRAINT portfolio_verifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_definitions role_definitions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_definitions
    ADD CONSTRAINT role_definitions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: tenant_admins tenant_admins_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.tenant_admins
    ADD CONSTRAINT tenant_admins_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_reports verification_reports_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.verification_reports
    ADD CONSTRAINT verification_reports_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: feature_toggles feature_toggles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feature_toggles
    ADD CONSTRAINT feature_toggles_pkey PRIMARY KEY (id);


--
-- Name: supercontroller_audit_logs supercontroller_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supercontroller_audit_logs
    ADD CONSTRAINT supercontroller_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: supercontroller supercontroller_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supercontroller
    ADD CONSTRAINT supercontroller_pkey PRIMARY KEY (id);


--
-- Name: tenant_metrics tenant_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenant_metrics
    ADD CONSTRAINT tenant_metrics_pkey PRIMARY KEY (id);


--
-- Name: Role_name_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "Role_name_key" ON auth."Role" USING btree (name);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON auth.audit_logs USING btree (action);


--
-- Name: audit_logs_createdAt_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "audit_logs_createdAt_idx" ON auth.audit_logs USING btree ("createdAt");


--
-- Name: audit_logs_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "audit_logs_tenantId_idx" ON auth.audit_logs USING btree ("tenantId");


--
-- Name: audit_logs_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "audit_logs_userId_idx" ON auth.audit_logs USING btree ("userId");


--
-- Name: bank_statements_fileChecksum_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "bank_statements_fileChecksum_key" ON auth.bank_statements USING btree ("fileChecksum");


--
-- Name: bank_statements_parsingStatus_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "bank_statements_parsingStatus_idx" ON auth.bank_statements USING btree ("parsingStatus");


--
-- Name: bank_statements_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "bank_statements_tenantId_idx" ON auth.bank_statements USING btree ("tenantId");


--
-- Name: bank_statements_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "bank_statements_userId_idx" ON auth.bank_statements USING btree ("userId");


--
-- Name: borrower_features_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "borrower_features_tenantId_idx" ON auth.borrower_features USING btree ("tenantId");


--
-- Name: borrower_features_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "borrower_features_userId_idx" ON auth.borrower_features USING btree ("userId");


--
-- Name: borrower_features_userId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "borrower_features_userId_key" ON auth.borrower_features USING btree ("userId");


--
-- Name: chat_conversations_sessionId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "chat_conversations_sessionId_idx" ON auth.chat_conversations USING btree ("sessionId");


--
-- Name: chat_conversations_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "chat_conversations_tenantId_idx" ON auth.chat_conversations USING btree ("tenantId");


--
-- Name: chat_conversations_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "chat_conversations_userId_idx" ON auth.chat_conversations USING btree ("userId");


--
-- Name: company_invites_email_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX company_invites_email_idx ON auth.company_invites USING btree (email);


--
-- Name: company_invites_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "company_invites_tenantId_idx" ON auth.company_invites USING btree ("tenantId");


--
-- Name: company_invites_token_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX company_invites_token_idx ON auth.company_invites USING btree (token);


--
-- Name: company_invites_token_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX company_invites_token_key ON auth.company_invites USING btree (token);


--
-- Name: company_requests_panNumber_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "company_requests_panNumber_idx" ON auth.company_requests USING btree ("panNumber");


--
-- Name: company_requests_panNumber_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "company_requests_panNumber_key" ON auth.company_requests USING btree ("panNumber");


--
-- Name: company_requests_requestedBy_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "company_requests_requestedBy_idx" ON auth.company_requests USING btree ("requestedBy");


--
-- Name: company_requests_slug_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX company_requests_slug_key ON auth.company_requests USING btree (slug);


--
-- Name: company_requests_status_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX company_requests_status_idx ON auth.company_requests USING btree (status);


--
-- Name: document_versions_documentId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "document_versions_documentId_idx" ON auth.document_versions USING btree ("documentId");


--
-- Name: documents_documentType_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "documents_documentType_idx" ON auth.documents USING btree ("documentType");


--
-- Name: documents_isDeleted_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "documents_isDeleted_idx" ON auth.documents USING btree ("isDeleted");


--
-- Name: documents_kycId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "documents_kycId_idx" ON auth.documents USING btree ("kycId");


--
-- Name: documents_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "documents_tenantId_idx" ON auth.documents USING btree ("tenantId");


--
-- Name: documents_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "documents_userId_idx" ON auth.documents USING btree ("userId");


--
-- Name: documents_verificationStatus_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "documents_verificationStatus_idx" ON auth.documents USING btree ("verificationStatus");


--
-- Name: employment_info_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "employment_info_tenantId_idx" ON auth.employment_info USING btree ("tenantId");


--
-- Name: employment_info_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "employment_info_userId_idx" ON auth.employment_info USING btree ("userId");


--
-- Name: employment_info_userId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "employment_info_userId_key" ON auth.employment_info USING btree ("userId");


--
-- Name: extraction_verifications_kycApplicationId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "extraction_verifications_kycApplicationId_idx" ON auth.extraction_verifications USING btree ("kycApplicationId");


--
-- Name: extraction_verifications_kycApplicationId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "extraction_verifications_kycApplicationId_key" ON auth.extraction_verifications USING btree ("kycApplicationId");


--
-- Name: face_verifications_kycApplicationId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "face_verifications_kycApplicationId_idx" ON auth.face_verifications USING btree ("kycApplicationId");


--
-- Name: face_verifications_kycApplicationId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "face_verifications_kycApplicationId_key" ON auth.face_verifications USING btree ("kycApplicationId");


--
-- Name: financial_documents_documentType_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "financial_documents_documentType_idx" ON auth.financial_documents USING btree ("documentType");


--
-- Name: financial_documents_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "financial_documents_tenantId_idx" ON auth.financial_documents USING btree ("tenantId");


--
-- Name: financial_documents_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "financial_documents_userId_idx" ON auth.financial_documents USING btree ("userId");


--
-- Name: financial_documents_verificationStatus_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "financial_documents_verificationStatus_idx" ON auth.financial_documents USING btree ("verificationStatus");


--
-- Name: financial_profiles_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "financial_profiles_tenantId_idx" ON auth.financial_profiles USING btree ("tenantId");


--
-- Name: financial_profiles_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "financial_profiles_userId_idx" ON auth.financial_profiles USING btree ("userId");


--
-- Name: financial_profiles_userId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "financial_profiles_userId_key" ON auth.financial_profiles USING btree ("userId");


--
-- Name: kyc_applications_status_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX kyc_applications_status_idx ON auth.kyc_applications USING btree (status);


--
-- Name: kyc_applications_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "kyc_applications_tenantId_idx" ON auth.kyc_applications USING btree ("tenantId");


--
-- Name: kyc_applications_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "kyc_applications_userId_idx" ON auth.kyc_applications USING btree ("userId");


--
-- Name: kyc_submission_files_kycApplicationId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "kyc_submission_files_kycApplicationId_idx" ON auth.kyc_submission_files USING btree ("kycApplicationId");


--
-- Name: kyc_submission_files_kycApplicationId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "kyc_submission_files_kycApplicationId_key" ON auth.kyc_submission_files USING btree ("kycApplicationId");


--
-- Name: loan_accounts_isActive_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_accounts_isActive_idx" ON auth.loan_accounts USING btree ("isActive");


--
-- Name: loan_accounts_status_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX loan_accounts_status_idx ON auth.loan_accounts USING btree (status);


--
-- Name: loan_accounts_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_accounts_tenantId_idx" ON auth.loan_accounts USING btree ("tenantId");


--
-- Name: loan_accounts_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_accounts_userId_idx" ON auth.loan_accounts USING btree ("userId");


--
-- Name: loan_applications_status_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX loan_applications_status_idx ON auth.loan_applications USING btree (status);


--
-- Name: loan_applications_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_applications_tenantId_idx" ON auth.loan_applications USING btree ("tenantId");


--
-- Name: loan_applications_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_applications_userId_idx" ON auth.loan_applications USING btree ("userId");


--
-- Name: loan_assessments_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_assessments_tenantId_idx" ON auth.loan_assessments USING btree ("tenantId");


--
-- Name: loan_assessments_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_assessments_userId_idx" ON auth.loan_assessments USING btree ("userId");


--
-- Name: loan_features_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_features_tenantId_idx" ON auth.loan_features USING btree ("tenantId");


--
-- Name: loan_features_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "loan_features_userId_idx" ON auth.loan_features USING btree ("userId");


--
-- Name: loan_features_userId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "loan_features_userId_key" ON auth.loan_features USING btree ("userId");


--
-- Name: manual_review_queue_kycApplicationId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "manual_review_queue_kycApplicationId_idx" ON auth.manual_review_queue USING btree ("kycApplicationId");


--
-- Name: manual_review_queue_priority_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX manual_review_queue_priority_idx ON auth.manual_review_queue USING btree (priority);


--
-- Name: manual_review_queue_status_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX manual_review_queue_status_idx ON auth.manual_review_queue USING btree (status);


--
-- Name: nlu_queries_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "nlu_queries_tenantId_idx" ON auth.nlu_queries USING btree ("tenantId");


--
-- Name: nlu_queries_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "nlu_queries_userId_idx" ON auth.nlu_queries USING btree ("userId");


--
-- Name: notification_preferences_userId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "notification_preferences_userId_key" ON auth.notification_preferences USING btree ("userId");


--
-- Name: notifications_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "notifications_tenantId_idx" ON auth.notifications USING btree ("tenantId");


--
-- Name: notifications_type_createdAt_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "notifications_type_createdAt_idx" ON auth.notifications USING btree (type, "createdAt");


--
-- Name: notifications_userId_status_createdAt_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "notifications_userId_status_createdAt_idx" ON auth.notifications USING btree ("userId", status, "createdAt");


--
-- Name: ocr_extractions_kycApplicationId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "ocr_extractions_kycApplicationId_idx" ON auth.ocr_extractions USING btree ("kycApplicationId");


--
-- Name: ocr_results_kycApplicationId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "ocr_results_kycApplicationId_idx" ON auth.ocr_results USING btree ("kycApplicationId");


--
-- Name: permission_definitions_name_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX permission_definitions_name_key ON auth.permission_definitions USING btree (name);


--
-- Name: portfolio_verifications_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "portfolio_verifications_tenantId_idx" ON auth.portfolio_verifications USING btree ("tenantId");


--
-- Name: portfolio_verifications_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "portfolio_verifications_userId_idx" ON auth.portfolio_verifications USING btree ("userId");


--
-- Name: portfolio_verifications_userId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "portfolio_verifications_userId_key" ON auth.portfolio_verifications USING btree ("userId");


--
-- Name: portfolio_verifications_verificationStatus_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "portfolio_verifications_verificationStatus_idx" ON auth.portfolio_verifications USING btree ("verificationStatus");


--
-- Name: profiles_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "profiles_userId_idx" ON auth.profiles USING btree ("userId");


--
-- Name: profiles_userId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "profiles_userId_key" ON auth.profiles USING btree ("userId");


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON auth.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: sessions_expiresAt_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "sessions_expiresAt_idx" ON auth.sessions USING btree ("expiresAt");


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "sessions_userId_idx" ON auth.sessions USING btree ("userId");


--
-- Name: tenants_panNumber_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "tenants_panNumber_key" ON auth.tenants USING btree ("panNumber");


--
-- Name: tenants_slug_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX tenants_slug_key ON auth.tenants USING btree (slug);


--
-- Name: transactions_bankStatementId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "transactions_bankStatementId_idx" ON auth.transactions USING btree ("bankStatementId");


--
-- Name: transactions_category_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX transactions_category_idx ON auth.transactions USING btree (category);


--
-- Name: transactions_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "transactions_tenantId_idx" ON auth.transactions USING btree ("tenantId");


--
-- Name: transactions_transactionDate_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "transactions_transactionDate_idx" ON auth.transactions USING btree ("transactionDate");


--
-- Name: transactions_userId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "transactions_userId_idx" ON auth.transactions USING btree ("userId");


--
-- Name: users_email_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX users_email_idx ON auth.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON auth.users USING btree (email);


--
-- Name: users_roleId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "users_roleId_idx" ON auth.users USING btree ("roleId");


--
-- Name: users_tenantId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "users_tenantId_idx" ON auth.users USING btree ("tenantId");


--
-- Name: verification_reports_kycApplicationId_idx; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX "verification_reports_kycApplicationId_idx" ON auth.verification_reports USING btree ("kycApplicationId");


--
-- Name: verification_reports_kycApplicationId_key; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE UNIQUE INDEX "verification_reports_kycApplicationId_key" ON auth.verification_reports USING btree ("kycApplicationId");


--
-- Name: feature_toggles_tenantId_featureName_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "feature_toggles_tenantId_featureName_key" ON public.feature_toggles USING btree ("tenantId", "featureName");


--
-- Name: supercontroller_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX supercontroller_email_key ON public.supercontroller USING btree (email);


--
-- Name: tenant_metrics_tenantId_metricDate_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "tenant_metrics_tenantId_metricDate_key" ON public.tenant_metrics USING btree ("tenantId", "metricDate");


--
-- Name: audit_logs audit_logs_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.audit_logs
    ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bank_statements bank_statements_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.bank_statements
    ADD CONSTRAINT "bank_statements_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: borrower_features borrower_features_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.borrower_features
    ADD CONSTRAINT "borrower_features_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_conversations chat_conversations_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.chat_conversations
    ADD CONSTRAINT "chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: document_versions document_versions_documentId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.document_versions
    ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES auth.documents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_kycId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.documents
    ADD CONSTRAINT "documents_kycId_fkey" FOREIGN KEY ("kycId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_replacedById_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.documents
    ADD CONSTRAINT "documents_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES auth.documents(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: documents documents_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.documents
    ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: documents documents_verifiedBy_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.documents
    ADD CONSTRAINT "documents_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employment_info employment_info_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.employment_info
    ADD CONSTRAINT "employment_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: extraction_verifications extraction_verifications_kycApplicationId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.extraction_verifications
    ADD CONSTRAINT "extraction_verifications_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: face_verifications face_verifications_kycApplicationId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.face_verifications
    ADD CONSTRAINT "face_verifications_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: financial_documents financial_documents_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.financial_documents
    ADD CONSTRAINT "financial_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: financial_profiles financial_profiles_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.financial_profiles
    ADD CONSTRAINT "financial_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kyc_applications kyc_applications_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.kyc_applications
    ADD CONSTRAINT "kyc_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: kyc_submission_files kyc_submission_files_kycApplicationId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.kyc_submission_files
    ADD CONSTRAINT "kyc_submission_files_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loan_accounts loan_accounts_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_accounts
    ADD CONSTRAINT "loan_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loan_applications loan_applications_reviewedBy_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_applications
    ADD CONSTRAINT "loan_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: loan_applications loan_applications_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_applications
    ADD CONSTRAINT "loan_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loan_assessments loan_assessments_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_assessments
    ADD CONSTRAINT "loan_assessments_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: loan_features loan_features_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.loan_features
    ADD CONSTRAINT "loan_features_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: manual_review_queue manual_review_queue_kycApplicationId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.manual_review_queue
    ADD CONSTRAINT "manual_review_queue_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: nlu_queries nlu_queries_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.nlu_queries
    ADD CONSTRAINT "nlu_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notification_preferences notification_preferences_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.notification_preferences
    ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ocr_extractions ocr_extractions_kycApplicationId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.ocr_extractions
    ADD CONSTRAINT "ocr_extractions_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ocr_results ocr_results_kycApplicationId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.ocr_results
    ADD CONSTRAINT "ocr_results_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portfolio_verifications portfolio_verifications_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.portfolio_verifications
    ADD CONSTRAINT "portfolio_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: profiles profiles_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.profiles
    ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES auth.permission_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES auth.role_definitions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tenant_admins tenant_admins_tenantId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.tenant_admins
    ADD CONSTRAINT "tenant_admins_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES auth.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_bankStatementId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.transactions
    ADD CONSTRAINT "transactions_bankStatementId_fkey" FOREIGN KEY ("bankStatementId") REFERENCES auth.bank_statements(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: transactions transactions_userId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.transactions
    ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_roleId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES auth."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: verification_reports verification_reports_kycApplicationId_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.verification_reports
    ADD CONSTRAINT "verification_reports_kycApplicationId_fkey" FOREIGN KEY ("kycApplicationId") REFERENCES auth.kyc_applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict xS7EGe49XPHQD72O3jWLN5NKfmQt93cbNrkDwmBmeJ8f76G4C4dBeCYdkyOsPRK

