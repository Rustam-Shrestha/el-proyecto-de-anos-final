--
-- PostgreSQL database dump
--

\restrict aBxSOI6qTj7rsf1cHgpQqb6XMrD4KwbhHOSHu5s5iQn5DcFT9764b9FtDhGDB3u

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

\unrestrict aBxSOI6qTj7rsf1cHgpQqb6XMrD4KwbhHOSHu5s5iQn5DcFT9764b9FtDhGDB3u

