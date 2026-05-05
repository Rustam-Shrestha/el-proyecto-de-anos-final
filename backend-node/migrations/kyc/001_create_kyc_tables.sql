"""
Database Migration Script for KYC Module.

This migration creates all tables required for the KYC workflow:
- users
- kyc_applications
- documents
- ocr_results
- face_verifications

All string columns use UTF-8 encoding to support mixed-script (Devanagari + English).
JSONB columns are used for structured_data and feature_vector for efficient querying.

To run this migration:
    alembic upgrade head

Or manually with psql:
    psql -U postgres -d kyc_db -f backend/migrations/kyc/001_create_kyc_tables.sql
"""

-- Users table is created by 001_init.sql with authentication columns
-- This ensures a single source of truth for user data
-- If you need to add KYC-specific columns, use ALTER TABLE to extend the existing users table

-- Uncomment below if you need to add KYC-specific columns to the existing users table:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'PENDING';

CREATE TABLE IF NOT EXISTS kyc_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    feature_vector JSONB,
    confidence_score FLOAT DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_kyc_applications_user_id ON kyc_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_status ON kyc_applications(status);
CREATE INDEX IF NOT EXISTS idx_kyc_applications_created_at ON kyc_applications(created_at);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_application_id UUID NOT NULL REFERENCES kyc_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_kyc_application_id ON documents(kyc_application_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

CREATE TABLE IF NOT EXISTS ocr_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_application_id UUID NOT NULL REFERENCES kyc_applications(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    raw_text TEXT NOT NULL,
    structured_data JSONB NOT NULL,
    confidence_score FLOAT DEFAULT 0.0 NOT NULL,
    language_detected VARCHAR(20) NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ocr_results_kyc_application_id ON ocr_results(kyc_application_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_language_detected ON ocr_results(language_detected);

CREATE TABLE IF NOT EXISTS face_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_application_id UUID NOT NULL REFERENCES kyc_applications(id) ON DELETE CASCADE,
    selfie_path VARCHAR(255) NOT NULL,
    id_document_path VARCHAR(255) NOT NULL,
    distance FLOAT NOT NULL,
    is_match BOOLEAN DEFAULT FALSE NOT NULL,
    model_used VARCHAR(50) DEFAULT 'vggface' NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_face_verifications_kyc_application_id ON face_verifications(kyc_application_id);
CREATE INDEX IF NOT EXISTS idx_face_verifications_is_match ON face_verifications(is_match);
