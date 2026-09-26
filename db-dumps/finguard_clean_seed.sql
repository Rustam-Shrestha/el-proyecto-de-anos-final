--
-- PostgreSQL database dump
--

\restrict kWLDZ3KyJ6GvMNrAebhVxN1EyebB6BSQZlwvdKTMPGMqdKeRBbKSaDFjaU4w6PP

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


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
    "acceptedAt" timestamp(3) without time zone,
    code character varying(6)
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
    "panNumber" character varying(30) NOT NULL,
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
    "panNumber" character varying(30),
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
    "encryptionEnabled" boolean DEFAULT true NOT NULL,
    "joinMode" character varying(10) DEFAULT 'code'::character varying NOT NULL
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
cmui93m740000sov6ljxe2kht	ADMIN	2026-09-26 10:32:36.64	2026-09-26 10:32:36.64
cmui93m7e0001sov64xehea2w	USER	2026-09-26 10:32:36.65	2026-09-26 10:32:36.65
cmui93m8p0002sov630w4vr5y	REVIEWER	2026-09-26 10:32:36.697	2026-09-26 10:32:36.697
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
cmui93pm3000fsov65n6211fl	2	cmui93obn0005sov6c58q6bfq	conv_seed_acme_admin_reviewer	[{"role": "user", "content": "Welcome to Acme Financial Corporation. Please review the pending KYC queue today.", "senderId": "cmui93obn0005sov6c58q6bfq", "timestamp": "2026-09-26T09:32:41.051Z"}, {"role": "user", "content": "On it — I will start with the demo customer application.", "senderId": "cmui93ozj0007sov6534jztwt", "timestamp": "2026-09-26T10:02:41.051Z"}]	{"type": "staff", "participants": ["cmui93obn0005sov6c58q6bfq", "cmui93ozj0007sov6534jztwt"]}	2026-09-26 10:32:41.067	2026-09-26 10:32:41.067
cmui93pm6000gsov6727e2xxv	2	cmui93ozj0007sov6534jztwt	conv_seed_acme_admin_reviewer	[{"role": "user", "content": "Welcome to Acme Financial Corporation. Please review the pending KYC queue today.", "senderId": "cmui93obn0005sov6c58q6bfq", "timestamp": "2026-09-26T09:32:41.051Z"}, {"role": "user", "content": "On it — I will start with the demo customer application.", "senderId": "cmui93ozj0007sov6534jztwt", "timestamp": "2026-09-26T10:02:41.051Z"}]	{"type": "staff", "participants": ["cmui93obn0005sov6c58q6bfq", "cmui93ozj0007sov6534jztwt"]}	2026-09-26 10:32:41.07	2026-09-26 10:32:41.07
\.


--
-- Data for Name: company_invites; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.company_invites (id, "tenantId", email, role, token, status, "invitedBy", "expiresAt", "createdAt", "acceptedAt", code) FROM stdin;
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
cmui93pkq000dsov686vxxp3i	2	cmui93pjd0009sov60bzmuxnl	EMPLOYED	Accountant	Acme Partners	\N	85000.00	1020000.00	2	\N	\N	\N	\N	\N	48	-1460	t	SALARY	50	2026-09-26 10:32:41.018	2026-09-26 10:32:41.018
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
cmui93pl4000esov68gdldtb3	2	cmui93pjd0009sov60bzmuxnl	0	\N	\N	85000.00	45000.00	1020000.00	540000.00	\N	0.47	\N	82	740	2026-09-26 10:32:41.032
\.


--
-- Data for Name: kyc_applications; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.kyc_applications (id, "tenantId", "userId", status, "submittedAt", "reviewedAt", "reviewerId", "rejectionReason", "ocrCitizenshipNumber", "ocrFullName", "ocrDateOfBirth", "ocrGender", "ocrAddress", "processingStatus", "ocrFrontStatus", "ocrBackStatus", "faceStatus", "ocrProcessingError", "faceProcessingError", "workflowStage", "faceVerificationStatus", "ocrProcessingStatus", "queuedForManualReview", "confirmedCitizenshipNumber", "confirmedFullName", "confirmedDateOfBirth", "confirmedGender", "confirmedAddress", "confirmedPhoneNumber", "confirmedEmail", "confirmedOccupation", "confirmedEmployer", "confirmedMonthlyIncome", "confirmedMaritalStatus", "confirmedEducationLevel", "createdAt", "updatedAt") FROM stdin;
cmui93pjx000bsov6qln4p9q5	2	cmui93pjd0009sov60bzmuxnl	PENDING	2026-09-26 10:32:40.984	\N	\N	\N	ACMEDEMO01	Demo Customer	\N	\N	\N	DONE	DONE	DONE	DONE	\N	\N	COMPLETE	VERIFIED	EXTRACTED	f	ACMEDEMO01	Demo Customer	\N	\N	\N	\N	\N	\N	\N	85000.00	\N	\N	2026-09-26 10:32:40.99	2026-09-26 10:32:40.99
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
cmui93pkh000csov6ypo3egj3	2	cmui93pjd0009sov60bzmuxnl	500000.00	36	PERSONAL	16200.00	SUBMITTED	45	MEDIUM	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-09-26 10:32:41.009	2026-09-26 10:32:41.009
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
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.profiles (id, "userId", "fullName", phone, address, "dateOfBirth", "avatarUrl", "updatedAt") FROM stdin;
cmui93ns80004sov6d899qyqf	cmui93ns50003sov6glulxyhg	FinGuard Super Admin	+977-9800000001	\N	\N	\N	2026-09-26 10:32:38.693
cmui93obp0006sov6eddzequ1	cmui93obn0005sov6c58q6bfq	Acme Admin	+977-9800000002	\N	\N	\N	2026-09-26 10:32:39.395
cmui93ozk0008sov63t6xoste	cmui93ozj0007sov6534jztwt	Acme Reviewer	+977-9800000003	\N	\N	\N	2026-09-26 10:32:40.255
cmui93pje000asov6dhritivj	cmui93pjd0009sov60bzmuxnl	Demo Customer	+977-9800000004	\N	\N	\N	2026-09-26 10:32:40.969
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
1	2	cmui93obn0005sov6c58q6bfq	shrestharama65@gmail.com	2026-09-26 10:32:39.409
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.tenants (id, slug, name, domain, "companyType", "panNumber", "logoUrl", status, "createdAt", "createdBy", "subscriptionTier", "maxUsers", "maxLoans", "usageLoans", "usageUsers", "lastActivity", "featureMlScoring", "featureAuditLogs", "featureApiAccess", "featureCustomWorkflows", "dataResidency", "encryptionEnabled", "joinMode") FROM stdin;
1	default	Default Tenant	default.finguard.local	platform	\N	/images/logo512.png	active	2026-09-26 10:32:36.719	\N	\N	100	1000	0	1	2026-09-26 10:32:41.105	t	t	t	f	\N	t	code
2	acme	Acme Financial Corporation	acme.finguard.local	bank	ACME000001A	/images/logo512.png	active	2026-09-26 10:32:36.737	\N	\N	100	1000	1	3	2026-09-26 10:32:41.122	t	t	t	f	\N	t	open
3	everest	Everest Credit Union	everest.finguard.local	credit-union	EVEREST0002B	/images/logo512.png	active	2026-09-26 10:32:36.741	\N	\N	100	1000	0	0	2026-09-26 10:32:41.139	t	t	t	f	\N	t	open
4	himalayan	Himalayan Microfinance	himalayan.finguard.local	microfinance	HIMALAYAN03C	/images/logo512.png	active	2026-09-26 10:32:36.745	\N	\N	100	1000	0	0	2026-09-26 10:32:41.154	t	t	t	f	\N	t	code
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.transactions (id, "tenantId", "bankStatementId", "userId", "transactionDate", description, debit, credit, balance, "transactionType", category, "confidenceScore", "createdAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.users (id, email, "passwordHash", "isVerified", "isDeleted", "tenantId", "roleId", "createdAt", "updatedAt") FROM stdin;
cmui93ns50003sov6glulxyhg	santosh.787402@smc.tu.edu.np	$2b$12$h66MrdYhoJ83i8Ch7YYF8OURLwPz.hQP0bbGPZrU/Njh9AgocUPuu	t	f	1	cmui93m740000sov6ljxe2kht	2026-09-26 10:32:38.693	2026-09-26 10:32:38.693
cmui93obn0005sov6c58q6bfq	shrestharama65@gmail.com	$2b$12$G2EvsIaG9gqMc1MAL3tMyuWh8WNrMJ6.RRvEzC8IiCzL77R/102a2	t	f	2	cmui93m740000sov6ljxe2kht	2026-09-26 10:32:39.395	2026-09-26 10:32:39.395
cmui93ozj0007sov6534jztwt	bcasmc2078@gmail.com	$2b$12$EFVG5k.NfKlWDPnvBQDMleMoMB/f2n5WLmhPvzpC067LS.k15.7oe	t	f	2	cmui93m8p0002sov630w4vr5y	2026-09-26 10:32:40.255	2026-09-26 10:32:40.255
cmui93pjd0009sov60bzmuxnl	shrestharama650@gmail.com	$2b$12$v1pAEAVNoskTaykGDhkXnOFCR8SvAngBrHAN8ZhIdiNoensZmwOvm	t	f	2	cmui93m7e0001sov64xehea2w	2026-09-26 10:32:40.969	2026-09-26 10:32:40.969
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
6ace9a77-1930-4090-bbd8-8800d9d962b9	dafe0b76e6ed4a5907bd937c519dcf0021fb15ae6bddef4f805c5727cac414cd	2026-09-26 16:17:33.08441+05:45	20260926070154_baseline	\N	\N	2026-09-26 16:17:32.126384+05:45	1
e5d64969-4c34-4084-b4f7-2e0fe8d40138	c13d35e324871fbc5e02ef7b0e47e5bc023af6cadb0e8c0e8d949aa4169c6ed3	2026-09-26 16:17:33.093345+05:45	20260926101732_company_join_modes	\N	\N	2026-09-26 16:17:33.085308+05:45	1
\.


--
-- Data for Name: feature_toggles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feature_toggles (id, "tenantId", "featureName", "isEnabled", "enabledBy", "enabledAt", "metadataJson") FROM stdin;
1	1	feature_ml_scoring	t	1	2026-09-26 10:32:41.076	\N
2	1	feature_audit_logs	t	1	2026-09-26 10:32:41.085	\N
3	1	feature_api_access	t	1	2026-09-26 10:32:41.087	\N
4	2	feature_ml_scoring	t	1	2026-09-26 10:32:41.11	\N
5	2	feature_audit_logs	t	1	2026-09-26 10:32:41.114	\N
6	2	feature_api_access	t	1	2026-09-26 10:32:41.116	\N
7	3	feature_ml_scoring	t	1	2026-09-26 10:32:41.126	\N
8	3	feature_audit_logs	t	1	2026-09-26 10:32:41.128	\N
9	3	feature_api_access	t	1	2026-09-26 10:32:41.13	\N
10	4	feature_ml_scoring	t	1	2026-09-26 10:32:41.144	\N
11	4	feature_audit_logs	t	1	2026-09-26 10:32:41.147	\N
12	4	feature_api_access	t	1	2026-09-26 10:32:41.149	\N
\.


--
-- Data for Name: supercontroller; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supercontroller (id, email, "passwordHash", "fullName", "createdAt", "lastLogin", status) FROM stdin;
1	santosh.787402@smc.tu.edu.np	$2b$12$7m6Lvrs6TsXcS/fNaPlBkO58DRShkMnJCvhpP./sa77xnF18NsbMO	FinGuard Super Admin	2026-09-26 10:32:37.524	\N	active
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

SELECT pg_catalog.setval('auth.tenant_admins_id_seq', 1, true);


--
-- Name: tenants_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.tenants_id_seq', 4, true);


--
-- Name: feature_toggles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feature_toggles_id_seq', 12, true);


--
-- Name: supercontroller_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_audit_logs_id_seq', 1, false);


--
-- Name: supercontroller_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supercontroller_id_seq', 1, true);


--
-- Name: tenant_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tenant_metrics_id_seq', 1, false);


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

\unrestrict kWLDZ3KyJ6GvMNrAebhVxN1EyebB6BSQZlwvdKTMPGMqdKeRBbKSaDFjaU4w6PP

