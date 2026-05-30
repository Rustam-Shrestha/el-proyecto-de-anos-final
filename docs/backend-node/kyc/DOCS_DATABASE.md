Database Schema Documentation - KYC Module

Overview

The KYC module uses PostgreSQL with SQLAlchemy ORM. All tables use UUID primary keys for cross-module compatibility and UTF-8 encoding for mixed-script support.

Database Setup

Connection String:
postgresql://user:password@localhost:5432/kyc_db

All string columns defined as VARCHAR() with UTF-8 implicit encoding.
JSONB columns used for structured_data and feature_vector for efficient querying and indexing.

Tables

1. users

Represents system users. Parent table for kyc_applications.

Schema:
- id (UUID, PK): Unique user identifier
- email (VARCHAR 255, UNIQUE): Email address, indexed for fast lookup
- phone (VARCHAR 20): Optional phone number
- name (VARCHAR 255): Full name, supports UTF-8 (Devanagari + English)
- created_at (TIMESTAMP): Account creation timestamp
- updated_at (TIMESTAMP): Last update timestamp

Indexes:
- idx_users_email: (email) - for login and lookups
- idx_users_created_at: (created_at) - for time-based queries

Example:
INSERT INTO users (id, email, name) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'raj@example.com',
  'राज कुमार'
);

2. kyc_applications

Represents a KYC application. Central entity coordinating the entire workflow.

Schema:
- id (UUID, PK): KYC application identifier
- user_id (UUID, FK -> users): Associated user
- status (VARCHAR 50): One of PENDING, APPROVED, REJECTED
- document_type (VARCHAR 50): Primary document type (citizenship, passport)
- feature_vector (JSONB): 64-D embedding vector from DeepFace VGG-Face model
  Example: [0.123, -0.456, ..., 0.789]
- confidence_score (FLOAT): Overall confidence (0.0-1.0), calculated from:
  avg(ocr_confidence, 1 - face_distance)
- created_at (TIMESTAMP): Application start time
- updated_at (TIMESTAMP): Last status change

Indexes:
- idx_kyc_applications_user_id: (user_id) - for user lookups
- idx_kyc_applications_status: (status) - for status filtering
- idx_kyc_applications_created_at: (created_at) - for reporting

Foreign Key Constraint:
- user_id REFERENCES users(id) ON DELETE CASCADE
  When user is deleted, all their KYC applications are deleted

Example:
INSERT INTO kyc_applications (id, user_id, status, document_type) VALUES (
  'a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'PENDING',
  'citizenship'
);

3. documents

Stores metadata for uploaded files. Multiple documents per KYC application.

Schema:
- id (UUID, PK): Document identifier
- kyc_application_id (UUID, FK -> kyc_applications): Associated KYC application
- document_type (VARCHAR 50): Type of document
  Values: citizenship_front, citizenship_back, passport, selfie
- file_path (VARCHAR 255): Relative path to file in uploads/kyc/
  Example: uploads/kyc/a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6/uuid_filename.jpg
- file_size (INTEGER): File size in bytes
- mime_type (VARCHAR 50): Content type (image/jpeg, image/png, etc.)
- uploaded_at (TIMESTAMP): Upload timestamp

Indexes:
- idx_documents_kyc_application_id: (kyc_application_id)
- idx_documents_document_type: (document_type) - for filtering by doc type

Foreign Key Constraint:
- kyc_application_id REFERENCES kyc_applications(id) ON DELETE CASCADE

Example:
INSERT INTO documents (id, kyc_application_id, document_type, file_path, file_size, mime_type) VALUES (
  'b3c2d4e5-f6a7-48b9-c0d1-e2f3g4h5i6j7',
  'a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  'citizenship_front',
  'uploads/kyc/a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6/7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d_citizenship.jpg',
  156320,
  'image/jpeg'
);

4. ocr_results

Stores OCR extraction results. One record per document (typically 2 per application: front + back).

Schema:
- id (UUID, PK): OCR result identifier
- kyc_application_id (UUID, FK -> kyc_applications): Associated application
- document_type (VARCHAR 50): Document this result came from (citizenship_front, citizenship_back)
- raw_text (TEXT): Complete unstructured OCR output (all extracted lines)
- structured_data (JSONB): Mapped key-value pairs from fuzzy matching
  Example: {
    "name": "राज कुमार",
    "surname": "शर्मा",
    "dob": "2000-01-15",
    "citizenship_number": "12345678",
    "gender": "Male",
    "address": "काठमाडौं, नेपाल"
  }
- confidence_score (FLOAT): Average confidence of matched fields (0.0-1.0)
- language_detected (VARCHAR 20): Detected language (hi, en, mixed)
- processed_at (TIMESTAMP): When OCR was performed

Indexes:
- idx_ocr_results_kyc_application_id: (kyc_application_id)
- idx_ocr_results_language_detected: (language_detected) - for reporting by language

Foreign Key Constraint:
- kyc_application_id REFERENCES kyc_applications(id) ON DELETE CASCADE

Example:
INSERT INTO ocr_results (id, kyc_application_id, document_type, raw_text, structured_data, confidence_score, language_detected) VALUES (
  'c4d3e5f6-a7b8-49c0-d1e2-f3g4h5i6j7k8',
  'a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  'citizenship_front',
  'नाम राज कुमार\nथर शर्मा\nजन्म मिति 2000-01-15\nनागरिकता नं 12345678',
  '{"name": "राज कुमार", "surname": "शर्मा", "dob": "2000-01-15", "citizenship_number": "12345678"}',
  0.92,
  'mixed'
);

5. face_verifications

Stores face matching results between selfie and ID document.

Schema:
- id (UUID, PK): Verification identifier
- kyc_application_id (UUID, FK -> kyc_applications): Associated application
- selfie_path (VARCHAR 255): Path to the selfie image
- id_document_path (VARCHAR 255): Path to the ID document image
- distance (FLOAT): Euclidean distance between face embeddings
  Range: 0.0 (identical) to 1.0+ (completely different)
- is_match (BOOLEAN): True if distance < 0.4 (VGG-Face threshold)
- model_used (VARCHAR 50): DeepFace model (vggface, facenet, arcface, etc.)
- verified_at (TIMESTAMP): Verification timestamp

Indexes:
- idx_face_verifications_kyc_application_id: (kyc_application_id)
- idx_face_verifications_is_match: (is_match) - for approval/rejection counts

Foreign Key Constraint:
- kyc_application_id REFERENCES kyc_applications(id) ON DELETE CASCADE

Example:
INSERT INTO face_verifications (id, kyc_application_id, selfie_path, id_document_path, distance, is_match, model_used) VALUES (
  'd5e4f6a7-b8c9-40d1-e2f3-g4h5i6j7k8l9',
  'a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  'uploads/kyc/a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6/selfie.jpg',
  'uploads/kyc/a2b1c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6/citizenship_front.jpg',
  0.32,
  true,
  'vggface'
);

Relationships & Constraints

User -> KYCApplication (1:N)
- One user can have multiple KYC applications
- Cascade delete: Deleting a user deletes all their KYC applications

KYCApplication -> Document (1:N)
- One KYC application has multiple documents (citizenship_front, citizenship_back, selfie)

KYCApplication -> OCRResult (1:N)
- One KYC application has OCR results for each citizenship document

KYCApplication -> FaceVerification (1:N)
- One KYC application can have multiple face verification attempts

Data Integrity

All UUID fields are generated using PostgreSQL's gen_random_uuid() function.
All timestamps are in UTC (use CURRENT_TIMESTAMP in migrations).
Foreign key constraints use ON DELETE CASCADE to maintain referential integrity.

Querying Patterns

Get all pending KYC applications:
SELECT * FROM kyc_applications WHERE status = 'PENDING';

Get OCR results for a specific application:
SELECT * FROM ocr_results WHERE kyc_application_id = '<app_id>';

Find users with approved KYC:
SELECT u.* FROM users u
JOIN kyc_applications k ON u.id = k.user_id
WHERE k.status = 'APPROVED';

Get face verification details for an application:
SELECT fv.distance, fv.is_match, fv.verified_at
FROM face_verifications fv
WHERE fv.kyc_application_id = '<app_id>'
ORDER BY fv.verified_at DESC LIMIT 1;

Performance Considerations

Indexing Strategy:
- User lookups by email (idx_users_email) for authentication
- Status filtering (idx_kyc_applications_status) for dashboard queries
- Time-based queries (idx_created_at) for reporting and analytics

JSONB Indexing:
Consider adding GIN index for frequent JSONB queries:
CREATE INDEX idx_ocr_structured_data ON ocr_results USING GIN (structured_data);

Partitioning:
For high-volume implementations, consider time-based partitioning on kyc_applications by created_at.

Migrations

Run migration to create tables:
psql -U postgres -d kyc_db -f backend-node/migrations/kyc/001_create_kyc_tables.sql

Verify tables:
\dt (list tables)
\d kyc_applications (describe table)

Backup Strategy

Regular backups of kyc_db:
pg_dump kyc_db > kyc_db_backup_$(date +%Y%m%d).sql

Restore from backup:
psql kyc_db < kyc_db_backup_YYYYMMDD.sql

Data Retention

Design decision: Retain all KYC records indefinitely for audit and compliance.
Implement soft delete if needed by adding deleted_at timestamp column.
