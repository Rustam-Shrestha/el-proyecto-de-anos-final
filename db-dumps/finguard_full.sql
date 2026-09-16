--
-- PostgreSQL database dump
--

\restrict BPocXO9VMYFXwBBHdIhf9OqoLrolFwTupZhQv2EgxJ6aEnAVjoO8PVCjlDRbtV3

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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

DROP DATABASE IF EXISTS finguard;
--
-- Name: finguard; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE finguard WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Nepali_Nepal.1252';


ALTER DATABASE finguard OWNER TO postgres;

\unrestrict BPocXO9VMYFXwBBHdIhf9OqoLrolFwTupZhQv2EgxJ6aEnAVjoO8PVCjlDRbtV3
\connect finguard
\restrict BPocXO9VMYFXwBBHdIhf9OqoLrolFwTupZhQv2EgxJ6aEnAVjoO8PVCjlDRbtV3

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
cmu3yqf6u0000s89jxbdeqg0z	REVIEWER	2026-09-16 10:33:38.407	2026-09-16 10:33:38.407
cmu3yqfbm0001s89jd23fs7ec	USER	2026-09-16 10:33:38.578	2026-09-16 10:33:38.578
cmu3yqfk10002s89jvpnxckrt	ADMIN	2026-09-16 10:33:38.881	2026-09-16 10:33:38.881
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.audit_logs (id, "tenantId", "userId", action, metadata, ip, "userAgent", "createdAt") FROM stdin;
cmu3yzdo90001m49jxe5e9fk3	1	cmu3yqp1f0003s89jx07kkq7k	LOGIN	{"email": "admin@finguard.local"}	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0	2026-09-16 10:40:36.345
\.


--
-- Data for Name: bank_statements; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.bank_statements (id, "tenantId", "userId", "bankName", "accountNumber", "accountHolderName", "statementFromDate", "statementToDate", "openingBalance", "closingBalance", "filePath", "fileChecksum", "parsingStatus", "errorMessage", "createdAt", "updatedAt") FROM stdin;
cmu3yr5y5001fs89jkis3w0sz	2	cmu3yqryh000fs89jc1gy5e18	Demo Bank	ACC1826054617	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.085	2026-09-16 10:34:13.085
cmu3yr60t001ss89jovjj5cqq	2	cmu3yqt21000hs89j427o95w6	Demo Bank	ACC8865290005	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.182	2026-09-16 10:34:13.182
cmu3yr62l0024s89jcajmt9m0	3	cmu3yqwei000ps89ju9ugozyk	Demo Bank	ACC7888500149	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.246	2026-09-16 10:34:13.246
cmu3yr64e002hs89j2hcr5uia	3	cmu3yqx3u000rs89jr0ujbyrh	Demo Bank	ACC2891819726	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.31	2026-09-16 10:34:13.31
cmu3yr66d002ts89j680nu5jn	4	cmu3yqyw0000vs89jh46x8qxd	Demo Bank	ACC9029271488	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.381	2026-09-16 10:34:13.381
cmu3yr67x0035s89jr8o6tr1m	5	cmu3yr2pm0011s89j1bvh5335	Demo Bank	ACC2562737487	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.437	2026-09-16 10:34:13.437
cmu3yr69l003is89jjm1bt7wt	5	cmu3yr3dx0013s89jknttmhix	Demo Bank	ACC3002560244	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.497	2026-09-16 10:34:13.497
cmu3yr6av003us89jqcegtedk	6	cmu3yr5th0017s89jzckxfaua	Demo Bank	ACC1581919681	\N	\N	\N	12000.00	18500.00	\N	\N	SUCCESS	\N	2026-09-16 10:34:13.543	2026-09-16 10:34:13.543
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
cmu3yr5uv001as89jnffhenn9	2	cmu3yqryh000fs89jc1gy5e18	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:12.967	2026-09-16 10:34:12.967
cmu3yr604001ns89j0mp4c8nh	2	cmu3yqt21000hs89j427o95w6	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:13.156	2026-09-16 10:34:13.156
cmu3yr61p001zs89jhjiasrl4	3	cmu3yqwei000ps89ju9ugozyk	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:13.213	2026-09-16 10:34:13.213
cmu3yr63q002cs89jotg1f7f0	3	cmu3yqx3u000rs89jr0ujbyrh	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:13.286	2026-09-16 10:34:13.286
cmu3yr65i002os89joornjat8	4	cmu3yqyw0000vs89jh46x8qxd	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:13.351	2026-09-16 10:34:13.351
cmu3yr67c0030s89jqy42jyia	5	cmu3yr2pm0011s89j1bvh5335	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:13.416	2026-09-16 10:34:13.416
cmu3yr68w003ds89jcwa0ks2k	5	cmu3yr3dx0013s89jknttmhix	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:13.472	2026-09-16 10:34:13.472
cmu3yr6aa003ps89jeejzwlz9	6	cmu3yr5th0017s89jzckxfaua	EMPLOYED	Engineer	Employer Inc	\N	5000.00	60000.00	1	\N	\N	\N	\N	\N	36	-1095	f	SALARY	50	2026-09-16 10:34:13.522	2026-09-16 10:34:13.522
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
cmu3yr5vi001bs89jsqsii5fx	2	cmu3yqryh000fs89jc1gy5e18	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:12.99
cmu3yr609001os89jj7ei1okz	2	cmu3yqt21000hs89j427o95w6	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:13.161
cmu3yr61s0020s89jhn5nf8i8	3	cmu3yqwei000ps89ju9ugozyk	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:13.216
cmu3yr63t002ds89j6dfdrs00	3	cmu3yqx3u000rs89jr0ujbyrh	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:13.289
cmu3yr65m002ps89j0a627y87	4	cmu3yqyw0000vs89jh46x8qxd	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:13.354
cmu3yr67f0031s89jos4xwztf	5	cmu3yr2pm0011s89j1bvh5335	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:13.419
cmu3yr694003es89jdxtp855x	5	cmu3yr3dx0013s89jknttmhix	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:13.48
cmu3yr6ae003qs89jvx1s1s88	6	cmu3yr5th0017s89jzckxfaua	0	\N	\N	5500.00	3200.00	66000.00	38400.00	\N	0.42	\N	78	720	2026-09-16 10:34:13.526
\.


--
-- Data for Name: kyc_applications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.kyc_applications (id, "tenantId", "userId", status, "submittedAt", "reviewedAt", "reviewerId", "rejectionReason", "ocrCitizenshipNumber", "ocrFullName", "ocrDateOfBirth", "ocrGender", "ocrAddress", "processingStatus", "ocrFrontStatus", "ocrBackStatus", "faceStatus", "ocrProcessingError", "faceProcessingError", "workflowStage", "faceVerificationStatus", "ocrProcessingStatus", "queuedForManualReview", "confirmedCitizenshipNumber", "confirmedFullName", "confirmedDateOfBirth", "confirmedGender", "confirmedAddress", "confirmedPhoneNumber", "confirmedEmail", "confirmedOccupation", "confirmedEmployer", "confirmedMonthlyIncome", "confirmedMaritalStatus", "confirmedEducationLevel", "createdAt", "updatedAt") FROM stdin;
cmu3yr5ui0019s89ju1gmvmis	2	cmu3yqryh000fs89jc1gy5e18	APPROVED	2026-09-11 10:34:12.946	2026-09-12 10:34:12.946	\N	\N	CIT-885021327	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-718486832	customer1	\N	\N	\N	\N	\N	\N	\N	6164.00	\N	\N	2026-09-16 10:34:12.954	2026-09-16 10:34:12.954
cmu3yr5zo001ls89js49iofl5	2	cmu3yqt21000hs89j427o95w6	APPROVED	2026-09-11 10:34:13.135	2026-09-12 10:34:13.135	\N	\N	CIT-280409681	customer2	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-107587302	customer2	\N	\N	\N	\N	\N	\N	\N	9646.00	\N	\N	2026-09-16 10:34:13.14	2026-09-16 10:34:13.14
cmu3yr600001ms89jagk14726	2	cmu3yqt21000hs89j427o95w6	PENDING	2026-09-16 10:34:13.152	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	PENDING	PENDING	PENDING	\N	\N	VALIDATING_FACE	PENDING	PENDING	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.152	2026-09-16 10:34:13.152
cmu3yr61j001ys89jy5xm77hs	3	cmu3yqwei000ps89ju9ugozyk	APPROVED	2026-09-11 10:34:13.202	2026-09-12 10:34:13.202	\N	\N	CIT-321578147	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-196528674	customer1	\N	\N	\N	\N	\N	\N	\N	9048.00	\N	\N	2026-09-16 10:34:13.207	2026-09-16 10:34:13.207
cmu3yr63b002as89j8iy8rgrp	3	cmu3yqx3u000rs89jr0ujbyrh	APPROVED	2026-09-11 10:34:13.267	2026-09-12 10:34:13.267	\N	\N	CIT-894207090	customer2	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-968615229	customer2	\N	\N	\N	\N	\N	\N	\N	5484.00	\N	\N	2026-09-16 10:34:13.272	2026-09-16 10:34:13.272
cmu3yr63m002bs89jkmjzuecn	3	cmu3yqx3u000rs89jr0ujbyrh	PENDING	2026-09-16 10:34:13.283	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	PENDING	PENDING	PENDING	\N	\N	VALIDATING_FACE	PENDING	PENDING	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.283	2026-09-16 10:34:13.283
cmu3yr65e002ns89jekxpp83j	4	cmu3yqyw0000vs89jh46x8qxd	APPROVED	2026-09-11 10:34:13.336	2026-09-12 10:34:13.336	\N	\N	CIT-560017430	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-350729447	customer1	\N	\N	\N	\N	\N	\N	\N	5448.00	\N	\N	2026-09-16 10:34:13.346	2026-09-16 10:34:13.346
cmu3yr677002zs89jrjnunj37	5	cmu3yr2pm0011s89j1bvh5335	APPROVED	2026-09-11 10:34:13.404	2026-09-12 10:34:13.404	\N	\N	CIT-498385596	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-254848683	customer1	\N	\N	\N	\N	\N	\N	\N	5119.00	\N	\N	2026-09-16 10:34:13.411	2026-09-16 10:34:13.411
cmu3yr68n003bs89jri6ewh4c	5	cmu3yr3dx0013s89jknttmhix	APPROVED	2026-09-11 10:34:13.458	2026-09-12 10:34:13.458	\N	\N	CIT-460929534	customer2	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-258436289	customer2	\N	\N	\N	\N	\N	\N	\N	5426.00	\N	\N	2026-09-16 10:34:13.463	2026-09-16 10:34:13.463
cmu3yr68t003cs89jlsw4g4ep	5	cmu3yr3dx0013s89jknttmhix	PENDING	2026-09-16 10:34:13.469	\N	\N	\N	\N	\N	\N	\N	\N	PENDING	PENDING	PENDING	PENDING	\N	\N	VALIDATING_FACE	PENDING	PENDING	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.469	2026-09-16 10:34:13.469
cmu3yr6a7003os89jyxcqr5qv	6	cmu3yr5th0017s89jzckxfaua	APPROVED	2026-09-11 10:34:13.515	2026-09-12 10:34:13.515	\N	\N	CIT-824814915	customer1	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	CIT-479872221	customer1	\N	\N	\N	\N	\N	\N	\N	5234.00	\N	\N	2026-09-16 10:34:13.519	2026-09-16 10:34:13.519
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
\.


--
-- Data for Name: loan_applications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.loan_applications (id, "tenantId", "userId", "requestedAmount", "tenureMonths", purpose, "calculatedEmi", status, "riskScore", "riskLevel", "loanOfficerNotes", "reviewedBy", "reviewedAt", "defaultProbability", "modelVersion", "shapValues", "featureSnapshot", "mlDecision", "creditScore", "createdAt", "updatedAt") FROM stdin;
cmu3yr5xa001ds89j4ui1m7p5	2	cmu3yqryh000fs89jc1gy5e18	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.054	2026-09-16 10:34:13.054
cmu3yr5xl001es89jvgtahphm	2	cmu3yqryh000fs89jc1gy5e18	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.065	2026-09-16 10:34:13.065
cmu3yr60i001qs89j44u6tyyw	2	cmu3yqt21000hs89j427o95w6	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.17	2026-09-16 10:34:13.17
cmu3yr60o001rs89j1mz4ghk9	2	cmu3yqt21000hs89j427o95w6	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.176	2026-09-16 10:34:13.176
cmu3yr6280022s89jn0gsnpty	3	cmu3yqwei000ps89ju9ugozyk	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.232	2026-09-16 10:34:13.232
cmu3yr62b0023s89jb0u3y45v	3	cmu3yqwei000ps89ju9ugozyk	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.235	2026-09-16 10:34:13.235
cmu3yr644002fs89jva4yes1w	3	cmu3yqx3u000rs89jr0ujbyrh	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.3	2026-09-16 10:34:13.3
cmu3yr648002gs89jw3d13ei9	3	cmu3yqx3u000rs89jr0ujbyrh	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.304	2026-09-16 10:34:13.304
cmu3yr661002rs89jg11cjirb	4	cmu3yqyw0000vs89jh46x8qxd	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.369	2026-09-16 10:34:13.369
cmu3yr664002ss89jkyp80cm8	4	cmu3yqyw0000vs89jh46x8qxd	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.372	2026-09-16 10:34:13.372
cmu3yr67q0033s89jxchc6qa5	5	cmu3yr2pm0011s89j1bvh5335	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.43	2026-09-16 10:34:13.43
cmu3yr67t0034s89jfk40nxiq	5	cmu3yr2pm0011s89j1bvh5335	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.433	2026-09-16 10:34:13.433
cmu3yr69c003gs89j1f5tmn13	5	cmu3yr3dx0013s89jknttmhix	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.488	2026-09-16 10:34:13.488
cmu3yr69g003hs89jabsm4hxw	5	cmu3yr3dx0013s89jknttmhix	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.492	2026-09-16 10:34:13.492
cmu3yr6am003ss89j4s9jw4b3	6	cmu3yr5th0017s89jzckxfaua	15000.00	24	PERSONAL	\N	APPROVED	32	LOW	\N	\N	\N	0.07	v1.0	\N	\N	\N	720	2026-09-16 10:34:13.534	2026-09-16 10:34:13.534
cmu3yr6ap003ts89j1jxsfqxh	6	cmu3yr5th0017s89jzckxfaua	8000.00	12	EDUCATION	\N	SUBMITTED	58	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-16 10:34:13.537	2026-09-16 10:34:13.537
\.


--
-- Data for Name: loan_assessments; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.loan_assessments (id, "tenantId", "userId", "requestedAmount", "loanTenureMonths", "interestRateAssumed", "eligibleAmount", "maxMonthlyEmi", "recommendedTenure", "eligibilityScore", "riskLevel", recommendation, "assessmentDetails", "createdAt") FROM stdin;
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
cmu3yr5w4001cs89jssyfpmkc	2	cmu3yqryh000fs89jc1gy5e18	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.013	2026-09-16 10:34:13.013	2026-09-16 10:34:13.013
cmu3yr60c001ps89jw5z99w2m	2	cmu3yqt21000hs89j427o95w6	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.164	2026-09-16 10:34:13.164	2026-09-16 10:34:13.164
cmu3yr6200021s89j0yyst06m	3	cmu3yqwei000ps89ju9ugozyk	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.224	2026-09-16 10:34:13.224	2026-09-16 10:34:13.224
cmu3yr63x002es89jfbd5ifr9	3	cmu3yqx3u000rs89jr0ujbyrh	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.294	2026-09-16 10:34:13.294	2026-09-16 10:34:13.294
cmu3yr65s002qs89j8kci8od1	4	cmu3yqyw0000vs89jh46x8qxd	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.36	2026-09-16 10:34:13.36	2026-09-16 10:34:13.36
cmu3yr67k0032s89jgi7nw9q1	5	cmu3yr2pm0011s89j1bvh5335	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.424	2026-09-16 10:34:13.424	2026-09-16 10:34:13.424
cmu3yr697003fs89jmq07nc67	5	cmu3yr3dx0013s89jknttmhix	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.483	2026-09-16 10:34:13.483	2026-09-16 10:34:13.483
cmu3yr6ah003rs89jquguktli	6	cmu3yr5th0017s89jzckxfaua	VERIFIED	3	3	0	t	t	\N	\N	\N	\N	\N	35	LOW	0	\N	\N	\N	\N	2026-09-16 10:34:13.529	2026-09-16 10:34:13.529	2026-09-16 10:34:13.529
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.profiles (id, "userId", "fullName", phone, address, "dateOfBirth", "avatarUrl", "updatedAt") FROM stdin;
cmu3yqp1k0004s89jgp5ql00q	cmu3yqp1f0003s89jx07kkq7k	System Admin	+1-555-0100	\N	\N	\N	2026-09-16 10:33:51.171
cmu3yqp220006s89ji7hg8a6t	cmu3yqp200005s89j4lsrvw47	KYC Reviewer	+1-555-0101	\N	\N	\N	2026-09-16 10:33:51.192
cmu3yqp2e0008s89jhbtt5w0b	cmu3yqp2d0007s89jf7vkcl3c	John Doe	+1-555-0102	123 Main St, Springfield	\N	\N	2026-09-16 10:33:51.205
cmu3yqpqk000as89jz0doenfu	cmu3yqpqi0009s89jkiu2fjql	Acme Admin	+1-555-1001	\N	\N	\N	2026-09-16 10:33:52.074
cmu3yqqe2000cs89jng8zt912	cmu3yqqe0000bs89j9tfgtek1	Acme Approver	+1-555-1002	\N	\N	\N	2026-09-16 10:33:52.92
cmu3yqr6o000es89jtcz4nmid	cmu3yqr6m000ds89jz8772cn8	Acme Validator	+1-555-1003	\N	\N	\N	2026-09-16 10:33:53.95
cmu3yqryj000gs89jley8x437	cmu3yqryh000fs89jc1gy5e18	Alice Acme	+1-555-1004	\N	\N	\N	2026-09-16 10:33:54.953
cmu3yqt22000is89jg1dzby0v	cmu3yqt21000hs89j427o95w6	Bob Acme	+1-555-1005	\N	\N	\N	2026-09-16 10:33:56.377
cmu3yqtql000ks89jc8oq6u98	cmu3yqtqk000js89jw1iwqta1	Eve Acme	+1-555-1006	\N	\N	\N	2026-09-16 10:33:57.26
cmu3yqun4000ms89jx01yomxq	cmu3yqun3000ls89jfi1dcr2k	Globe Admin	+1-555-2001	\N	\N	\N	2026-09-16 10:33:58.431
cmu3yqvm1000os89j723fm6xo	cmu3yqvm0000ns89jptkh2kir	Globe Approver	+1-555-2002	\N	\N	\N	2026-09-16 10:33:59.688
cmu3yqwej000qs89jwf7ds4eq	cmu3yqwei000ps89ju9ugozyk	Clara Globe	+1-555-2003	\N	\N	\N	2026-09-16 10:34:00.714
cmu3yqx3w000ss89jluda1ufx	cmu3yqx3u000rs89jr0ujbyrh	David Globe	+1-555-2004	\N	\N	\N	2026-09-16 10:34:01.626
cmu3yqy6n000us89j58xtw1tm	cmu3yqy6l000ts89juh717uib	FastCredit Admin	+1-555-3001	\N	\N	\N	2026-09-16 10:34:03.021
cmu3yqyw1000ws89jsi8i5ta2	cmu3yqyw0000vs89jh46x8qxd	Fiona Fast	+1-555-3002	\N	\N	\N	2026-09-16 10:34:03.936
cmu3yqzo7000ys89jujoq44qd	cmu3yqzo5000xs89jz00tb7v3	Everest Admin	+1-555-4001	\N	\N	\N	2026-09-16 10:34:04.949
cmu3yr0wa0010s89jswixrovi	cmu3yr0w6000zs89ji3zge16s	Everest Approver	+1-555-4002	\N	\N	\N	2026-09-16 10:34:06.534
cmu3yr2pn0012s89ja71ak2y9	cmu3yr2pm0011s89j1bvh5335	Eva Everest	+1-555-4003	\N	\N	\N	2026-09-16 10:34:08.89
cmu3yr3dz0014s89jv8p8xni3	cmu3yr3dx0013s89jknttmhix	Sam Everest	+1-555-4004	\N	\N	\N	2026-09-16 10:34:09.766
cmu3yr49t0016s89ju0j3k070	cmu3yr49s0015s89jifj3v6l9	Himalayan Admin	+1-555-5001	\N	\N	\N	2026-09-16 10:34:10.912
cmu3yr5ti0018s89joa6jey59	cmu3yr5th0017s89jzckxfaua	Hari Himalayan	+1-555-5002	\N	\N	\N	2026-09-16 10:34:12.917
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
cmu3yzdn60000m49j2kezvo9n	cmu3yqp1f0003s89jx07kkq7k	$2b$12$PMm9IJxH3w3d68qVUEvIyOOMDlsI7BT7ZKqQ/2P1KJmTWD7u0yihC	f	2026-09-23 10:40:36.28	2026-09-16 10:40:36.306
\.


--
-- Data for Name: tenant_admins; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.tenant_admins (id, "tenantId", "userId", email, "createdAt") FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.tenants (id, slug, name, domain, "companyType", status, "createdAt", "createdBy", "subscriptionTier", "maxUsers", "maxLoans", "usageLoans", "usageUsers", "lastActivity", "featureMlScoring", "featureAuditLogs", "featureApiAccess", "featureCustomWorkflows", "dataResidency", "encryptionEnabled") FROM stdin;
1	default	Default Tenant	default.finguard.local	fintech	active	2026-09-16 10:33:41.556	\N	professional	500	10000	0	3	2026-09-16 10:34:13.844	t	t	t	f	\N	t
2	finguard-acme	Acme Financial Corporation	acme.finguard.local	bank	active	2026-09-16 10:33:43.003	\N	enterprise	500	10000	4	6	2026-09-16 10:34:14.021	t	t	t	f	\N	t
3	finguard-globebank	GlobeBank	globebank.finguard.local	bank	active	2026-09-16 10:33:43.204	\N	enterprise	1000	50000	4	4	2026-09-16 10:34:14.187	t	t	t	f	\N	t
4	finguard-fastcredit	FastCredit Fintech	fastcredit.finguard.local	fintech	active	2026-09-16 10:33:43.562	\N	basic	100	1000	2	2	2026-09-16 10:34:14.347	t	t	t	f	\N	t
6	finguard-himalayan	Himalayan Microfinance	himalayan.finguard.local	microfinance	active	2026-09-16 10:33:44.107	\N	basic	150	2000	2	2	2026-09-16 10:34:14.666	t	t	t	f	\N	t
5	finguard-everest	Everest Credit Union	everest.finguard.local	credit-union	active	2026-09-16 10:33:43.822	\N	professional	300	5000	4	4	2026-09-16 10:34:14.507	t	t	t	f	\N	t
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.transactions (id, "tenantId", "bankStatementId", "userId", "transactionDate", description, debit, credit, balance, "transactionType", category, "confidenceScore", "createdAt") FROM stdin;
cmu3yr5ye001gs89jxmlkly6g	2	cmu3yr5y5001fs89jkis3w0sz	cmu3yqryh000fs89jc1gy5e18	2026-09-16 10:34:13.09	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.094
cmu3yr5yy001hs89j3s93imft	2	cmu3yr5y5001fs89jkis3w0sz	cmu3yqryh000fs89jc1gy5e18	2026-09-09 10:34:13.09	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.114
cmu3yr5z3001is89jcjsesm2m	2	cmu3yr5y5001fs89jkis3w0sz	cmu3yqryh000fs89jc1gy5e18	2026-09-02 10:34:13.09	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.119
cmu3yr5z9001js89j5s63h442	2	cmu3yr5y5001fs89jkis3w0sz	cmu3yqryh000fs89jc1gy5e18	2026-08-26 10:34:13.09	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.125
cmu3yr5ze001ks89jtel5z09h	2	cmu3yr5y5001fs89jkis3w0sz	cmu3yqryh000fs89jc1gy5e18	2026-08-19 10:34:13.09	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.13
cmu3yr60x001ts89j05j6yaz1	2	cmu3yr60t001ss89jovjj5cqq	cmu3yqt21000hs89j427o95w6	2026-09-16 10:34:13.184	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.185
cmu3yr610001us89jzcct1c3d	2	cmu3yr60t001ss89jovjj5cqq	cmu3yqt21000hs89j427o95w6	2026-09-09 10:34:13.184	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.188
cmu3yr613001vs89j4p7ov0xg	2	cmu3yr60t001ss89jovjj5cqq	cmu3yqt21000hs89j427o95w6	2026-09-02 10:34:13.184	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.191
cmu3yr616001ws89jibtbvjsx	2	cmu3yr60t001ss89jovjj5cqq	cmu3yqt21000hs89j427o95w6	2026-08-26 10:34:13.184	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.194
cmu3yr619001xs89jf577bj1z	2	cmu3yr60t001ss89jovjj5cqq	cmu3yqt21000hs89j427o95w6	2026-08-19 10:34:13.184	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.197
cmu3yr62q0025s89jl4m71oxx	3	cmu3yr62l0024s89jcajmt9m0	cmu3yqwei000ps89ju9ugozyk	2026-09-16 10:34:13.249	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.25
cmu3yr62s0026s89jhtk12q34	3	cmu3yr62l0024s89jcajmt9m0	cmu3yqwei000ps89ju9ugozyk	2026-09-09 10:34:13.249	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.252
cmu3yr62v0027s89jrdkmsqt7	3	cmu3yr62l0024s89jcajmt9m0	cmu3yqwei000ps89ju9ugozyk	2026-09-02 10:34:13.249	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.255
cmu3yr6300028s89ja3v53cqz	3	cmu3yr62l0024s89jcajmt9m0	cmu3yqwei000ps89ju9ugozyk	2026-08-26 10:34:13.249	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.26
cmu3yr6330029s89jttfdo5bu	3	cmu3yr62l0024s89jcajmt9m0	cmu3yqwei000ps89ju9ugozyk	2026-08-19 10:34:13.249	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.263
cmu3yr64h002is89jky8gpfkg	3	cmu3yr64e002hs89j2hcr5uia	cmu3yqx3u000rs89jr0ujbyrh	2026-09-16 10:34:13.313	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.313
cmu3yr64k002js89jp2r07oah	3	cmu3yr64e002hs89j2hcr5uia	cmu3yqx3u000rs89jr0ujbyrh	2026-09-09 10:34:13.313	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.316
cmu3yr64p002ks89jhsg92tso	3	cmu3yr64e002hs89j2hcr5uia	cmu3yqx3u000rs89jr0ujbyrh	2026-09-02 10:34:13.313	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.321
cmu3yr64u002ls89jdhceat1m	3	cmu3yr64e002hs89j2hcr5uia	cmu3yqx3u000rs89jr0ujbyrh	2026-08-26 10:34:13.313	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.326
cmu3yr64y002ms89jn74w2i1c	3	cmu3yr64e002hs89j2hcr5uia	cmu3yqx3u000rs89jr0ujbyrh	2026-08-19 10:34:13.313	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.33
cmu3yr66g002us89jjd4aq9b0	4	cmu3yr66d002ts89j680nu5jn	cmu3yqyw0000vs89jh46x8qxd	2026-09-16 10:34:13.383	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.384
cmu3yr66j002vs89jlx8p6p91	4	cmu3yr66d002ts89j680nu5jn	cmu3yqyw0000vs89jh46x8qxd	2026-09-09 10:34:13.383	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.387
cmu3yr66p002ws89jm6dbgva2	4	cmu3yr66d002ts89j680nu5jn	cmu3yqyw0000vs89jh46x8qxd	2026-09-02 10:34:13.383	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.393
cmu3yr66s002xs89j4lgw05wd	4	cmu3yr66d002ts89j680nu5jn	cmu3yqyw0000vs89jh46x8qxd	2026-08-26 10:34:13.383	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.396
cmu3yr66v002ys89jlide1ftd	4	cmu3yr66d002ts89j680nu5jn	cmu3yqyw0000vs89jh46x8qxd	2026-08-19 10:34:13.383	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.399
cmu3yr6820036s89j9damhbl9	5	cmu3yr67x0035s89jr8o6tr1m	cmu3yr2pm0011s89j1bvh5335	2026-09-16 10:34:13.441	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.442
cmu3yr6850037s89jnwdail72	5	cmu3yr67x0035s89jr8o6tr1m	cmu3yr2pm0011s89j1bvh5335	2026-09-09 10:34:13.441	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.445
cmu3yr6880038s89jmqg0ce65	5	cmu3yr67x0035s89jr8o6tr1m	cmu3yr2pm0011s89j1bvh5335	2026-09-02 10:34:13.441	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.448
cmu3yr68a0039s89j1v3e5806	5	cmu3yr67x0035s89jr8o6tr1m	cmu3yr2pm0011s89j1bvh5335	2026-08-26 10:34:13.441	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.45
cmu3yr68d003as89j0u2fgf0y	5	cmu3yr67x0035s89jr8o6tr1m	cmu3yr2pm0011s89j1bvh5335	2026-08-19 10:34:13.441	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.453
cmu3yr69o003js89jr5rpwfs2	5	cmu3yr69l003is89jjm1bt7wt	cmu3yr3dx0013s89jknttmhix	2026-09-16 10:34:13.499	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.5
cmu3yr69q003ks89j559cghv7	5	cmu3yr69l003is89jjm1bt7wt	cmu3yr3dx0013s89jknttmhix	2026-09-09 10:34:13.499	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.502
cmu3yr69t003ls89jl0r9ehmk	5	cmu3yr69l003is89jjm1bt7wt	cmu3yr3dx0013s89jknttmhix	2026-09-02 10:34:13.499	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.505
cmu3yr69w003ms89j9xpz3owd	5	cmu3yr69l003is89jjm1bt7wt	cmu3yr3dx0013s89jknttmhix	2026-08-26 10:34:13.499	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.508
cmu3yr69y003ns89jhju13ed8	5	cmu3yr69l003is89jjm1bt7wt	cmu3yr3dx0013s89jknttmhix	2026-08-19 10:34:13.499	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.51
cmu3yr6ay003vs89j2foxcqqu	6	cmu3yr6av003us89jqcegtedk	cmu3yr5th0017s89jzckxfaua	2026-09-16 10:34:13.545	Salary credit	\N	5000.00	15000.00	\N	INCOME	1	2026-09-16 10:34:13.546
cmu3yr6b1003ws89j3ewjxh7u	6	cmu3yr6av003us89jqcegtedk	cmu3yr5th0017s89jzckxfaua	2026-09-09 10:34:13.545	Grocery expense	1200.00	\N	15500.00	\N	EXPENSE	1	2026-09-16 10:34:13.549
cmu3yr6b3003xs89jjrktu6t4	6	cmu3yr6av003us89jqcegtedk	cmu3yr5th0017s89jzckxfaua	2026-09-02 10:34:13.545	Salary credit	\N	5000.00	16000.00	\N	INCOME	1	2026-09-16 10:34:13.551
cmu3yr6b6003ys89jt3x1mtwv	6	cmu3yr6av003us89jqcegtedk	cmu3yr5th0017s89jzckxfaua	2026-08-26 10:34:13.545	Grocery expense	1200.00	\N	16500.00	\N	EXPENSE	1	2026-09-16 10:34:13.554
cmu3yr6b9003zs89j867gy3jt	6	cmu3yr6av003us89jqcegtedk	cmu3yr5th0017s89jzckxfaua	2026-08-19 10:34:13.545	Salary credit	\N	5000.00	17000.00	\N	INCOME	1	2026-09-16 10:34:13.557
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.users (id, email, "passwordHash", "isVerified", "isDeleted", "tenantId", "roleId", "createdAt", "updatedAt") FROM stdin;
cmu3yqp1f0003s89jx07kkq7k	admin@finguard.local	$2b$12$lXcfQpL3DnsQ7sAQsO3n8uTTwvYO.9MgKNsgMItNI8zObZ/FIvYYO	t	f	1	cmu3yqfk10002s89jvpnxckrt	2026-09-16 10:33:51.171	2026-09-16 10:33:51.171
cmu3yqp200005s89j4lsrvw47	reviewer@finguard.local	$2b$12$v9CGMMwhLxatUMemKQjXcOI8l9BSDOkWWal1Hw7DC3GKmnWpg48H.	t	f	1	cmu3yqf6u0000s89jxbdeqg0z	2026-09-16 10:33:51.192	2026-09-16 10:33:51.192
cmu3yqp2d0007s89jf7vkcl3c	user@finguard.local	$2b$12$tmYNHjz1VThCCh6aQZnUQuSbA6GaSgz4TftIQu2OVAwRiDkrARQgu	t	f	1	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:33:51.205	2026-09-16 10:33:51.205
cmu3yqpqi0009s89jkiu2fjql	admin@acme.finguard.test	$2b$12$I8pHF.9Be/K15iKmmqLlhesslIMTxprwSa9VZuZRAT/8oeWLqpKFG	t	f	2	cmu3yqfk10002s89jvpnxckrt	2026-09-16 10:33:52.074	2026-09-16 10:33:52.074
cmu3yqqe0000bs89j9tfgtek1	approver@acme.finguard.test	$2b$12$CX2H1igCD.ihL2aFQRHRc.WN5G.DyYOC6Q3T5cGBwMnR90jcZf.ne	t	f	2	cmu3yqf6u0000s89jxbdeqg0z	2026-09-16 10:33:52.92	2026-09-16 10:33:52.92
cmu3yqr6m000ds89jz8772cn8	validator@acme.finguard.test	$2b$12$JR4SLzZDubgjmGFziefii.sxp094EiWKZKsIs8eBIWtoH1esyImky	t	f	2	cmu3yqf6u0000s89jxbdeqg0z	2026-09-16 10:33:53.95	2026-09-16 10:33:53.95
cmu3yqryh000fs89jc1gy5e18	customer1@acme.finguard.test	$2b$12$Ewr9D8RqeVK2NKtMUEKSyOF9JPjxfGwAwJ3x5/LsfXBSJk8gqj65i	t	f	2	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:33:54.953	2026-09-16 10:33:54.953
cmu3yqt21000hs89j427o95w6	customer2@acme.finguard.test	$2b$12$IJc8jUUIUqtKwMnGdAkirOFZSnDKK/RoztxVLgBekg2dvzeT92p4.	t	f	2	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:33:56.377	2026-09-16 10:33:56.377
cmu3yqtqk000js89jw1iwqta1	employee@acme.finguard.test	$2b$12$ydfzxlqr5g7DCTuDqJdzJeg9si6G0j.jYZSAzkGgOOKkwpaObmqyW	t	f	2	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:33:57.26	2026-09-16 10:33:57.26
cmu3yqun3000ls89jfi1dcr2k	admin@globebank.finguard.test	$2b$12$6pBmi0IBN79zzKUVg0LvDO3nSXRIRQUQIwxOJqbjGKW.gTuFzHXzK	t	f	3	cmu3yqfk10002s89jvpnxckrt	2026-09-16 10:33:58.431	2026-09-16 10:33:58.431
cmu3yqvm0000ns89jptkh2kir	approver@globebank.finguard.test	$2b$12$Z2szj8N0Etjseusv8RIrKu32dwu0E5FGpkQQKkmCeaEddKmgQEgOa	t	f	3	cmu3yqf6u0000s89jxbdeqg0z	2026-09-16 10:33:59.688	2026-09-16 10:33:59.688
cmu3yqwei000ps89ju9ugozyk	customer1@globebank.finguard.test	$2b$12$hyjqdxkMaBCnjZyptJ4MXuOukQWOpj9q5TXZSOA7af/pNGpC7oI5C	t	f	3	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:34:00.714	2026-09-16 10:34:00.714
cmu3yqx3u000rs89jr0ujbyrh	customer2@globebank.finguard.test	$2b$12$qWsXZCPjNFekap8cNO0CwONadQiFP/9VpOngRMurpysLpQl/kpi0q	t	f	3	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:34:01.626	2026-09-16 10:34:01.626
cmu3yqy6l000ts89juh717uib	admin@fastcredit.finguard.test	$2b$12$swc/OYJTf5puW2z074eKSOQUfiP2NpK25pc.HpwlTRxJrBWbRdS7C	t	f	4	cmu3yqfk10002s89jvpnxckrt	2026-09-16 10:34:03.021	2026-09-16 10:34:03.021
cmu3yqyw0000vs89jh46x8qxd	customer1@fastcredit.finguard.test	$2b$12$huGtGz37iWyoUK6AZddDpOLNbVtT1vhDy.L9zcI4MXGXeu0oh1VHO	t	f	4	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:34:03.936	2026-09-16 10:34:03.936
cmu3yqzo5000xs89jz00tb7v3	admin@everest.finguard.test	$2b$12$p7AN37Ed2H2lhjoFVf7ssOTjYouw0gxnrlwEj4lCOSrXx31nXNKWG	t	f	5	cmu3yqfk10002s89jvpnxckrt	2026-09-16 10:34:04.949	2026-09-16 10:34:04.949
cmu3yr0w6000zs89ji3zge16s	approver@everest.finguard.test	$2b$12$JazXJKUOxiK9pNqcXgCmgeo9gkRJZp.V8Tv04p1MJ62AinEKT5yZi	t	f	5	cmu3yqf6u0000s89jxbdeqg0z	2026-09-16 10:34:06.534	2026-09-16 10:34:06.534
cmu3yr2pm0011s89j1bvh5335	customer1@everest.finguard.test	$2b$12$V.SPo77IzphmIT//A3qRJ.I2GhVheO3mnP3xAEuSMtek2OR0AaFOa	t	f	5	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:34:08.89	2026-09-16 10:34:08.89
cmu3yr3dx0013s89jknttmhix	customer2@everest.finguard.test	$2b$12$w6j7YwtIb2mqCM0VyQoexO8GKFf2QfMlu5/OIH3KNbOqQYdWL0Ari	t	f	5	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:34:09.766	2026-09-16 10:34:09.766
cmu3yr49s0015s89jifj3v6l9	admin@himalayan.finguard.test	$2b$12$jABdGqMVy3SFgu61ZCijeO9NekrJ172rc3ukQkmLeF8aLHSDXzqPy	t	f	6	cmu3yqfk10002s89jvpnxckrt	2026-09-16 10:34:10.912	2026-09-16 10:34:10.912
cmu3yr5th0017s89jzckxfaua	customer1@himalayan.finguard.test	$2b$12$Fp1qeKHDwM5QUFuJ9SyJp.JBplv4Q7HNWNllZhbx/mYDK/iFJbSNa	t	f	6	cmu3yqfbm0001s89jd23fs7ec	2026-09-16 10:34:12.917	2026-09-16 10:34:12.917
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
7c5721ca-8b36-4759-b463-8721daac95e8	56fe5eb91a4329fc65b9f844ea15af83ea90b66913ddf28f6ded678ae0c8baaa	2026-09-16 16:20:15.750749+05:45	20250916000000_add_tenant_rbac		\N	2026-09-16 16:20:15.750749+05:45	0
df08553e-ebfb-4447-9697-61a735819650	9692fa371c5e273694ee81473bf822997a316836dcd8b98aa91d6fe12a801ea4	2026-09-16 16:20:28.364318+05:45	20250916000001_supercontroller_hierarchy		\N	2026-09-16 16:20:28.364318+05:45	0
a0bfeb7c-0c16-43bb-b49b-c843a8578dc6	3207bf5e9d77bd4844d1a7aef472982167e9070501eee9565aefae35e950f6cf	2026-09-16 16:20:40.406657+05:45	20250916000002_fix_loan_ml_columns		\N	2026-09-16 16:20:40.406657+05:45	0
806f7834-2ba5-4d00-87cc-7021e132c649	fc82897bcead3bb891bae3b6531ef4a32a3bb98ecfca3b93458ca6c43beeab99	2026-09-16 16:20:58.279271+05:45	20260722032719_init		\N	2026-09-16 16:20:58.279271+05:45	0
\.


--
-- Data for Name: feature_toggles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_toggles (id, "tenantId", "featureName", "isEnabled", "enabledBy", "enabledAt", "metadataJson") FROM stdin;
1	1	feature_ml_scoring	t	1	2026-09-16 10:33:46.045	\N
2	1	feature_audit_logs	t	1	2026-09-16 10:33:46.058	\N
3	1	feature_api_access	t	1	2026-09-16 10:33:46.06	\N
4	1	feature_custom_workflows	t	1	2026-09-16 10:33:46.063	\N
5	2	feature_ml_scoring	t	1	2026-09-16 10:33:46.067	\N
6	2	feature_audit_logs	t	1	2026-09-16 10:33:46.074	\N
7	2	feature_api_access	t	1	2026-09-16 10:33:46.076	\N
8	2	feature_custom_workflows	t	1	2026-09-16 10:33:46.079	\N
9	3	feature_ml_scoring	t	1	2026-09-16 10:33:46.081	\N
10	3	feature_audit_logs	t	1	2026-09-16 10:33:46.085	\N
11	3	feature_api_access	t	1	2026-09-16 10:33:46.089	\N
12	3	feature_custom_workflows	t	1	2026-09-16 10:33:46.091	\N
13	4	feature_ml_scoring	t	1	2026-09-16 10:33:46.094	\N
14	4	feature_audit_logs	f	1	2026-09-16 10:33:46.097	\N
15	4	feature_api_access	f	1	2026-09-16 10:33:46.1	\N
16	4	feature_custom_workflows	f	1	2026-09-16 10:33:46.104	\N
17	5	feature_ml_scoring	t	1	2026-09-16 10:33:46.107	\N
18	5	feature_audit_logs	t	1	2026-09-16 10:33:46.109	\N
20	5	feature_custom_workflows	t	1	2026-09-16 10:33:46.115	\N
21	6	feature_ml_scoring	t	1	2026-09-16 10:33:46.118	\N
22	6	feature_audit_logs	f	1	2026-09-16 10:33:46.121	\N
23	6	feature_api_access	f	1	2026-09-16 10:33:46.172	\N
24	6	feature_custom_workflows	f	1	2026-09-16 10:33:46.177	\N
19	5	feature_api_access	t	1	2026-09-16 10:41:12.804	\N
\.


--
-- Data for Name: supercontroller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supercontroller (id, email, "passwordHash", "fullName", "createdAt", "lastLogin", status) FROM stdin;
1	admin@finguard.io	$2b$12$2.WLgc6mE6TcpCKszv6v.uKiixwxuwbLC1j2e2/XDVQHSULEKZIuO	FinGuard Super Admin	2026-09-16 10:33:40.318	\N	active
\.


--
-- Data for Name: supercontroller_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supercontroller_audit_logs (id, "supercontrollerId", action, "targetType", "targetId", "changesJson", "ipAddress", "createdAt") FROM stdin;
1	1	feature.toggle	feature	5:feature_api_access	{"featureName":"feature_api_access","isEnabled":false}	\N	2026-09-16 10:41:12.201
2	1	feature.toggle	feature	5:feature_api_access	{"featureName":"feature_api_access","isEnabled":true}	\N	2026-09-16 10:41:12.811
\.


--
-- Data for Name: tenant_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenant_metrics (id, "tenantId", "metricDate", "totalUsers", "totalLoans", "totalRevenue", "apiCalls", "errorRate", "avgResponseTimeMs", "createdAt") FROM stdin;
1	1	2026-09-15	12	20	24000.00	644	1.50	109	2026-09-16 10:34:13.567
2	1	2026-09-14	15	25	30000.00	570	1.65	111	2026-09-16 10:34:13.583
3	1	2026-09-13	12	32	38400.00	635	0.04	96	2026-09-16 10:34:13.588
4	1	2026-09-12	10	32	38400.00	686	0.71	116	2026-09-16 10:34:13.594
5	1	2026-09-11	10	34	40800.00	532	1.24	98	2026-09-16 10:34:13.599
6	1	2026-09-10	17	24	28800.00	762	0.43	84	2026-09-16 10:34:13.604
7	1	2026-09-09	14	29	34800.00	620	1.74	117	2026-09-16 10:34:13.611
8	1	2026-09-08	13	21	25200.00	616	1.09	98	2026-09-16 10:34:13.616
9	1	2026-09-07	17	26	31200.00	587	1.16	82	2026-09-16 10:34:13.621
10	1	2026-09-06	10	33	39600.00	738	0.93	109	2026-09-16 10:34:13.627
11	1	2026-09-05	12	21	25200.00	763	0.93	89	2026-09-16 10:34:13.634
12	1	2026-09-04	15	26	31200.00	714	0.25	119	2026-09-16 10:34:13.64
13	1	2026-09-03	16	23	27600.00	629	0.32	97	2026-09-16 10:34:13.645
14	1	2026-09-02	10	24	28800.00	610	1.81	88	2026-09-16 10:34:13.649
15	1	2026-09-01	17	23	27600.00	712	0.16	88	2026-09-16 10:34:13.654
16	1	2026-08-31	17	23	27600.00	546	1.09	110	2026-09-16 10:34:13.664
17	1	2026-08-30	14	31	37200.00	754	0.84	81	2026-09-16 10:34:13.687
18	1	2026-08-29	17	21	25200.00	545	0.46	99	2026-09-16 10:34:13.754
19	1	2026-08-28	11	31	37200.00	519	0.30	99	2026-09-16 10:34:13.76
20	1	2026-08-27	17	28	33600.00	767	1.19	102	2026-09-16 10:34:13.765
21	1	2026-08-26	17	21	25200.00	602	0.38	83	2026-09-16 10:34:13.77
22	1	2026-08-25	10	28	33600.00	607	1.58	99	2026-09-16 10:34:13.776
23	1	2026-08-24	15	28	33600.00	644	0.22	112	2026-09-16 10:34:13.78
24	1	2026-08-23	17	22	26400.00	560	1.68	91	2026-09-16 10:34:13.786
25	1	2026-08-22	12	30	36000.00	604	1.69	86	2026-09-16 10:34:13.794
26	1	2026-08-21	13	26	31200.00	634	0.34	101	2026-09-16 10:34:13.798
27	1	2026-08-20	11	33	39600.00	525	0.86	117	2026-09-16 10:34:13.805
28	1	2026-08-19	12	20	24000.00	687	1.48	110	2026-09-16 10:34:13.811
29	1	2026-08-18	16	20	24000.00	523	1.02	85	2026-09-16 10:34:13.816
30	1	2026-08-17	15	34	40800.00	752	1.70	112	2026-09-16 10:34:13.82
31	2	2026-09-15	17	22	26400.00	724	0.20	101	2026-09-16 10:34:13.856
32	2	2026-09-14	12	28	33600.00	543	0.81	118	2026-09-16 10:34:13.862
33	2	2026-09-13	13	23	27600.00	520	0.93	81	2026-09-16 10:34:13.867
34	2	2026-09-12	15	29	34800.00	731	0.83	84	2026-09-16 10:34:13.873
35	2	2026-09-11	10	28	33600.00	720	0.89	81	2026-09-16 10:34:13.88
36	2	2026-09-10	10	27	32400.00	726	0.28	87	2026-09-16 10:34:13.885
37	2	2026-09-09	10	29	34800.00	775	0.22	93	2026-09-16 10:34:13.89
38	2	2026-09-08	11	23	27600.00	724	1.35	81	2026-09-16 10:34:13.895
39	2	2026-09-07	16	22	26400.00	733	1.70	94	2026-09-16 10:34:13.899
40	2	2026-09-06	11	25	30000.00	657	0.56	110	2026-09-16 10:34:13.904
41	2	2026-09-05	15	26	31200.00	541	2.00	100	2026-09-16 10:34:13.909
42	2	2026-09-04	12	27	32400.00	517	1.30	89	2026-09-16 10:34:13.914
43	2	2026-09-03	16	30	36000.00	588	0.64	119	2026-09-16 10:34:13.92
44	2	2026-09-02	13	31	37200.00	564	1.82	111	2026-09-16 10:34:13.932
45	2	2026-09-01	16	28	33600.00	587	0.88	98	2026-09-16 10:34:13.937
46	2	2026-08-31	17	32	38400.00	745	0.60	108	2026-09-16 10:34:13.943
47	2	2026-08-30	15	25	30000.00	589	1.99	87	2026-09-16 10:34:13.948
48	2	2026-08-29	17	26	31200.00	711	0.17	97	2026-09-16 10:34:13.953
49	2	2026-08-28	10	34	40800.00	675	1.88	109	2026-09-16 10:34:13.959
50	2	2026-08-27	16	24	28800.00	728	0.02	99	2026-09-16 10:34:13.965
51	2	2026-08-26	13	29	34800.00	685	1.22	109	2026-09-16 10:34:13.97
52	2	2026-08-25	14	25	30000.00	734	1.95	103	2026-09-16 10:34:13.976
53	2	2026-08-24	17	21	25200.00	501	1.85	104	2026-09-16 10:34:13.981
54	2	2026-08-23	16	25	30000.00	775	0.07	107	2026-09-16 10:34:13.985
55	2	2026-08-22	10	26	31200.00	678	1.22	87	2026-09-16 10:34:13.99
56	2	2026-08-21	16	21	25200.00	534	0.81	89	2026-09-16 10:34:13.995
57	2	2026-08-20	12	20	24000.00	703	1.27	100	2026-09-16 10:34:14
58	2	2026-08-19	17	25	30000.00	666	0.54	95	2026-09-16 10:34:14.005
59	2	2026-08-18	17	25	30000.00	712	0.70	100	2026-09-16 10:34:14.011
60	2	2026-08-17	12	26	31200.00	736	1.93	92	2026-09-16 10:34:14.015
61	3	2026-09-15	49	27	32400.00	571	0.63	93	2026-09-16 10:34:14.027
62	3	2026-09-14	54	21	25200.00	624	0.04	94	2026-09-16 10:34:14.031
63	3	2026-09-13	47	22	26400.00	707	0.74	116	2026-09-16 10:34:14.036
64	3	2026-09-12	54	28	33600.00	672	0.87	80	2026-09-16 10:34:14.041
65	3	2026-09-11	52	28	33600.00	595	0.32	114	2026-09-16 10:34:14.047
66	3	2026-09-10	49	23	27600.00	795	1.44	96	2026-09-16 10:34:14.051
67	3	2026-09-09	51	25	30000.00	659	1.38	100	2026-09-16 10:34:14.056
68	3	2026-09-08	53	21	25200.00	570	0.91	89	2026-09-16 10:34:14.061
69	3	2026-09-07	49	34	40800.00	747	0.41	90	2026-09-16 10:34:14.066
70	3	2026-09-06	53	27	32400.00	794	1.82	108	2026-09-16 10:34:14.07
71	3	2026-09-05	54	29	34800.00	797	0.12	106	2026-09-16 10:34:14.076
72	3	2026-09-04	54	34	40800.00	791	0.49	99	2026-09-16 10:34:14.081
73	3	2026-09-03	53	23	27600.00	737	1.16	106	2026-09-16 10:34:14.085
74	3	2026-09-02	52	31	37200.00	505	0.77	103	2026-09-16 10:34:14.09
75	3	2026-09-01	47	27	32400.00	622	0.73	102	2026-09-16 10:34:14.095
76	3	2026-08-31	50	34	40800.00	604	1.32	91	2026-09-16 10:34:14.099
77	3	2026-08-30	50	20	24000.00	622	0.69	80	2026-09-16 10:34:14.104
78	3	2026-08-29	53	21	25200.00	672	1.26	90	2026-09-16 10:34:14.109
79	3	2026-08-28	51	33	39600.00	739	0.66	92	2026-09-16 10:34:14.114
80	3	2026-08-27	54	34	40800.00	688	0.19	107	2026-09-16 10:34:14.119
81	3	2026-08-26	51	24	28800.00	547	1.28	83	2026-09-16 10:34:14.125
82	3	2026-08-25	49	20	24000.00	742	1.28	95	2026-09-16 10:34:14.13
83	3	2026-08-24	51	30	36000.00	615	0.91	117	2026-09-16 10:34:14.135
84	3	2026-08-23	46	31	37200.00	541	1.88	119	2026-09-16 10:34:14.143
85	3	2026-08-22	45	20	24000.00	549	0.45	119	2026-09-16 10:34:14.147
86	3	2026-08-21	48	34	40800.00	581	1.20	116	2026-09-16 10:34:14.153
87	3	2026-08-20	46	21	25200.00	783	1.66	105	2026-09-16 10:34:14.167
88	3	2026-08-19	47	20	24000.00	577	0.98	85	2026-09-16 10:34:14.171
89	3	2026-08-18	45	34	40800.00	735	1.97	90	2026-09-16 10:34:14.177
90	3	2026-08-17	51	23	27600.00	717	1.21	82	2026-09-16 10:34:14.181
91	4	2026-09-15	13	29	34800.00	540	0.33	95	2026-09-16 10:34:14.194
92	4	2026-09-14	10	33	39600.00	769	0.01	80	2026-09-16 10:34:14.199
93	4	2026-09-13	14	21	25200.00	517	1.23	104	2026-09-16 10:34:14.203
94	4	2026-09-12	16	20	24000.00	792	1.40	88	2026-09-16 10:34:14.208
95	4	2026-09-11	12	24	28800.00	622	1.34	112	2026-09-16 10:34:14.213
96	4	2026-09-10	14	27	32400.00	589	1.65	87	2026-09-16 10:34:14.218
97	4	2026-09-09	11	22	26400.00	586	0.20	91	2026-09-16 10:34:14.223
98	4	2026-09-08	15	22	26400.00	523	0.79	99	2026-09-16 10:34:14.229
99	4	2026-09-07	15	22	26400.00	507	0.13	84	2026-09-16 10:34:14.235
100	4	2026-09-06	15	25	30000.00	526	0.43	111	2026-09-16 10:34:14.24
101	4	2026-09-05	17	25	30000.00	609	0.87	118	2026-09-16 10:34:14.245
102	4	2026-09-04	13	32	38400.00	711	1.65	92	2026-09-16 10:34:14.25
103	4	2026-09-03	12	30	36000.00	605	1.58	86	2026-09-16 10:34:14.255
104	4	2026-09-02	11	26	31200.00	722	1.48	82	2026-09-16 10:34:14.26
105	4	2026-09-01	11	20	24000.00	584	0.33	117	2026-09-16 10:34:14.265
106	4	2026-08-31	15	23	27600.00	764	0.21	88	2026-09-16 10:34:14.27
107	4	2026-08-30	17	25	30000.00	583	0.13	98	2026-09-16 10:34:14.275
108	4	2026-08-29	11	26	31200.00	623	0.65	85	2026-09-16 10:34:14.28
109	4	2026-08-28	13	28	33600.00	637	0.45	117	2026-09-16 10:34:14.284
110	4	2026-08-27	15	24	28800.00	758	1.29	91	2026-09-16 10:34:14.289
111	4	2026-08-26	16	29	34800.00	518	0.45	86	2026-09-16 10:34:14.294
112	4	2026-08-25	11	29	34800.00	500	0.59	83	2026-09-16 10:34:14.299
113	4	2026-08-24	17	31	37200.00	778	1.71	95	2026-09-16 10:34:14.305
114	4	2026-08-23	13	31	37200.00	654	0.40	94	2026-09-16 10:34:14.312
115	4	2026-08-22	12	20	24000.00	711	0.65	88	2026-09-16 10:34:14.317
116	4	2026-08-21	17	30	36000.00	518	1.16	84	2026-09-16 10:34:14.322
117	4	2026-08-20	17	31	37200.00	538	0.91	95	2026-09-16 10:34:14.327
118	4	2026-08-19	10	34	40800.00	515	0.60	109	2026-09-16 10:34:14.332
119	4	2026-08-18	11	27	32400.00	575	1.21	95	2026-09-16 10:34:14.336
120	4	2026-08-17	16	30	36000.00	539	0.48	104	2026-09-16 10:34:14.341
121	5	2026-09-15	16	32	38400.00	732	1.83	112	2026-09-16 10:34:14.352
122	5	2026-09-14	17	32	38400.00	519	1.80	108	2026-09-16 10:34:14.357
123	5	2026-09-13	16	28	33600.00	793	1.32	110	2026-09-16 10:34:14.362
124	5	2026-09-12	13	22	26400.00	757	0.05	89	2026-09-16 10:34:14.367
125	5	2026-09-11	13	27	32400.00	526	0.93	85	2026-09-16 10:34:14.373
126	5	2026-09-10	14	32	38400.00	776	1.62	82	2026-09-16 10:34:14.379
127	5	2026-09-09	16	28	33600.00	731	0.35	108	2026-09-16 10:34:14.383
128	5	2026-09-08	11	22	26400.00	529	1.91	104	2026-09-16 10:34:14.388
129	5	2026-09-07	16	25	30000.00	678	1.31	109	2026-09-16 10:34:14.393
130	5	2026-09-06	17	23	27600.00	767	1.43	116	2026-09-16 10:34:14.397
131	5	2026-09-05	15	29	34800.00	540	0.03	111	2026-09-16 10:34:14.402
132	5	2026-09-04	16	31	37200.00	651	1.34	99	2026-09-16 10:34:14.407
133	5	2026-09-03	17	31	37200.00	734	0.96	117	2026-09-16 10:34:14.411
134	5	2026-09-02	17	34	40800.00	643	1.09	111	2026-09-16 10:34:14.416
135	5	2026-09-01	16	28	33600.00	790	0.09	80	2026-09-16 10:34:14.422
136	5	2026-08-31	12	23	27600.00	615	0.29	95	2026-09-16 10:34:14.428
137	5	2026-08-30	10	28	33600.00	561	1.88	100	2026-09-16 10:34:14.433
138	5	2026-08-29	11	25	30000.00	731	0.98	108	2026-09-16 10:34:14.438
139	5	2026-08-28	10	28	33600.00	551	0.73	110	2026-09-16 10:34:14.445
140	5	2026-08-27	11	25	30000.00	731	1.29	91	2026-09-16 10:34:14.45
141	5	2026-08-26	17	31	37200.00	732	0.61	101	2026-09-16 10:34:14.455
142	5	2026-08-25	11	29	34800.00	706	1.36	102	2026-09-16 10:34:14.459
143	5	2026-08-24	16	20	24000.00	783	0.39	113	2026-09-16 10:34:14.464
144	5	2026-08-23	10	32	38400.00	636	0.32	87	2026-09-16 10:34:14.468
145	5	2026-08-22	14	33	39600.00	750	1.22	87	2026-09-16 10:34:14.473
146	5	2026-08-21	12	31	37200.00	765	0.28	101	2026-09-16 10:34:14.478
147	5	2026-08-20	16	27	32400.00	608	0.73	117	2026-09-16 10:34:14.482
148	5	2026-08-19	16	34	40800.00	746	1.45	95	2026-09-16 10:34:14.488
149	5	2026-08-18	12	25	30000.00	561	1.21	98	2026-09-16 10:34:14.494
150	5	2026-08-17	15	27	32400.00	601	0.48	92	2026-09-16 10:34:14.499
151	6	2026-09-15	13	23	27600.00	581	0.36	115	2026-09-16 10:34:14.513
152	6	2026-09-14	12	29	34800.00	733	0.84	108	2026-09-16 10:34:14.517
153	6	2026-09-13	16	21	25200.00	528	0.03	116	2026-09-16 10:34:14.522
154	6	2026-09-12	12	30	36000.00	628	0.07	90	2026-09-16 10:34:14.527
155	6	2026-09-11	17	32	38400.00	687	0.07	113	2026-09-16 10:34:14.531
156	6	2026-09-10	10	24	28800.00	769	1.73	91	2026-09-16 10:34:14.536
157	6	2026-09-09	15	26	31200.00	620	0.18	82	2026-09-16 10:34:14.542
158	6	2026-09-08	17	34	40800.00	572	0.56	90	2026-09-16 10:34:14.546
159	6	2026-09-07	16	24	28800.00	743	1.24	96	2026-09-16 10:34:14.551
160	6	2026-09-06	15	34	40800.00	562	1.35	100	2026-09-16 10:34:14.555
161	6	2026-09-05	16	22	26400.00	775	0.65	96	2026-09-16 10:34:14.56
162	6	2026-09-04	16	20	24000.00	686	1.39	95	2026-09-16 10:34:14.565
163	6	2026-09-03	14	24	28800.00	552	0.78	109	2026-09-16 10:34:14.569
164	6	2026-09-02	15	27	32400.00	702	0.14	102	2026-09-16 10:34:14.574
165	6	2026-09-01	17	32	38400.00	626	1.98	108	2026-09-16 10:34:14.579
166	6	2026-08-31	17	33	39600.00	615	1.02	94	2026-09-16 10:34:14.585
167	6	2026-08-30	10	31	37200.00	778	0.14	101	2026-09-16 10:34:14.59
168	6	2026-08-29	17	26	31200.00	603	0.80	107	2026-09-16 10:34:14.595
169	6	2026-08-28	14	34	40800.00	784	1.04	115	2026-09-16 10:34:14.6
170	6	2026-08-27	12	27	32400.00	531	0.09	97	2026-09-16 10:34:14.606
171	6	2026-08-26	10	34	40800.00	744	1.72	102	2026-09-16 10:34:14.611
172	6	2026-08-25	16	23	27600.00	625	0.24	119	2026-09-16 10:34:14.615
173	6	2026-08-24	15	32	38400.00	775	1.53	89	2026-09-16 10:34:14.62
174	6	2026-08-23	13	23	27600.00	729	0.79	89	2026-09-16 10:34:14.626
175	6	2026-08-22	11	27	32400.00	750	0.20	113	2026-09-16 10:34:14.63
176	6	2026-08-21	13	20	24000.00	564	0.05	91	2026-09-16 10:34:14.635
177	6	2026-08-20	14	26	31200.00	775	1.76	94	2026-09-16 10:34:14.642
178	6	2026-08-19	14	29	34800.00	525	0.59	103	2026-09-16 10:34:14.648
179	6	2026-08-18	17	33	39600.00	616	0.55	97	2026-09-16 10:34:14.653
180	6	2026-08-17	10	22	26400.00	546	0.39	103	2026-09-16 10:34:14.66
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

SELECT pg_catalog.setval('auth.tenant_admins_id_seq', 1, false);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.tenants_id_seq', 6, true);


--
-- Name: feature_toggles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feature_toggles_id_seq', 26, true);


--
-- Name: supercontroller_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_audit_logs_id_seq', 2, true);


--
-- Name: supercontroller_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_id_seq', 1, true);


--
-- Name: tenant_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_metrics_id_seq', 180, true);


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

\unrestrict BPocXO9VMYFXwBBHdIhf9OqoLrolFwTupZhQv2EgxJ6aEnAVjoO8PVCjlDRbtV3

