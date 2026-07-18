# KYCOCR.md: KYC Document OCR & Face Verification System Context

**For:** AI Coding Agents debugging/extending OCR + face verification functionality  
**Scope:** FastAPI microservice (Python) + Node.js backend integration + React frontend  
**Critical Focus:** JSON population, timeout issues, low-spec device optimization  
**Last Updated:** June 2026  
**Status:** Production system with known timeout issues

---

## 1. Project Identity: KYC OCR + Face Verification

### Purpose
Extract key information from identity documents (Nepalese citizenship certificates, passports) using OCR (Devnagri + English). Verify that the face in a selfie matches the face in the identity document. Populate verification JSON with extracted data for admin review.

### Tech Stack
- **FastAPI Backend:** OCR + face verification microservice (Python)
  - EasyOCR (Devnagri + English text extraction)
  - DeepFace (face matching)
  - OpenCV (image preprocessing)
  - Fuzzy matching (thefuzz library)

- **Node.js Backend:** REST API, orchestration, database
  - Axios HTTP client calling FastAPI
  - Prisma ORM for storing results
  - File upload handling (Multer)

- **React Frontend:** Multi-step KYC wizard
  - Step 2: Document upload (citizenship front/back, selfie)
  - Step 3: OCR processing display
  - Step 4: Face verification results
  - Step 5: User review + confirmation

### Environment
- **Low-spec devices:** Must complete OCR in <30s, face match in <20s
- **Timeout:** Currently hardcoded to 90 retries = broken (see Section 11)
- **Package Manager:** npm (Node), pip (Python)
- **Database:** PostgreSQL with Prisma

---

## 2. Repository Architecture

### Folder Structure (OCR/Face Only)

```
backend-fastapi/
  app/
    api/v1/endpoints/
      kyc.py                     # FastAPI routes for OCR & face endpoints
    models/
      ocr_result.py             # ORM model for OCR results
      face_verification.py      # ORM model for face results
      kyc.py                    # KYC application model
    services/
      ocr_service.py            # EasyOCR processing (Devnagri + English)
      identity_service.py       # DeepFace face matching
      
backend-node/
  src/
    services/
      ocrService.ts             # Node client calling FastAPI /api/v1/kyc/ocr/citizenship
      faceService.ts            # Node client calling FastAPI /api/v1/kyc/face/verify
      kycVerificationService.ts # Generates verification report (face score + OCR score)
      kycService.ts             # KYC application submission (triggers OCR/face in background)
    controllers/
      kycController.ts          # submitKyc endpoint (calls ocrService, faceService via setImmediate)
    routes/
      kycRoutes.ts              # POST /kyc (submit documents) - triggers background processing
      
frontend/
  src/
    features/kyc/
      components/
        Step2Processing.tsx      # Shows OCR/face progress
        Step3Review.tsx          # Displays extracted fields for user confirmation
        Step4FaceResult.tsx      # Shows face similarity score
        Step5Report.tsx          # Final verification report
      hooks/
        useKyc.ts               # Calls backend submit endpoint
```

### Boundaries
- **FastAPI (Python):** Handles all ML/OCR/face processing
- **Node.js (TypeScript):** REST orchestration, database, authentication
- **Frontend (React):** UI, user confirmation, field review
- **No direct database access from FastAPI:** All results persisted via Node routes

---

## 3. System Architecture: Request Lifecycle

### Complete KYC Submission + OCR + Face Flow

```
1. Frontend (React)
   ↓ User uploads documents (citizenship front/back, selfie)
   ↓ POST /api/v1/kyc/submit with document paths
   ↓
2. Backend (Node.js - kycController.submitKyc)
   ├─ Create KYCApplication record in database
   ├─ Create Document records (CITIZENSHIP_FRONT, CITIZENSHIP_BACK, SELFIE)
   ├─ Return response to frontend (200 OK)
   ├─ setImmediate(() => {  // Non-blocking background processing
   │   ├─ resolveAbsolutePath(documentPath)
   │   ├─ ocrService.extractCitizenshipData(frontPath, 'CITIZENSHIP_FRONT')
   │   │   ↓
   │   ├─ FastAPI POST /api/v1/kyc/ocr/citizenship
   │   │   │
   │   │   └─ FastAPI (ocr_service.py)
   │   │       ├─ Load image from disk
   │   │       ├─ Preprocess (CLAHE, resize)
   │   │       ├─ EasyOCR.readtext() → extract text with confidence
   │   │       ├─ Language detection (Devnagri vs English)
   │   │       ├─ Fuzzy match against FIELD_KEYWORDS
   │   │       └─ Return: { rawText, extractedData: {name, citizenship#, dob, ...}, confidence }
   │   │
   │   ├─ Store ocrResult in database
   │   ├─ Prefill kycApplication fields (ocrFullName, ocrCitizenshipNumber, etc.)
   │   │
   │   ├─ faceService.verifyFace(frontPath, selfiePath)
   │   │   ↓
   │   ├─ FastAPI POST /api/v1/kyc/face/verify
   │   │   │
   │   │   └─ FastAPI (identity_service.py)
   │   │       ├─ Detect face in ID document
   │   │       ├─ Crop face from ID
   │   │       ├─ DeepFace.verify(selfie, id_crop) → distance
   │   │       └─ Return: { similarityScore, status, recommendation }
   │   │
   │   └─ Store faceVerification in database
   │
3. Frontend (React - Step 3 & 4)
   ├─ Poll GET /api/v1/kyc/status to check progress
   ├─ Display OCR extracted fields (name, citizenship #, DOB, address, gender)
   ├─ Display face similarity score
   └─ User confirms or corrects fields → POST /api/v1/kyc/submit-confirmed-data
   
4. Admin Review
   ├─ GET /api/v1/kyc/get-verification-report/{kycId}
   └─ kycVerificationService generates report (OCR conf + face score)
```

### Critical: Background Processing (setImmediate)
- **Non-blocking:** Response sent to frontend BEFORE OCR/face processing
- **Fire-and-forget:** If OCR fails, JSON may be empty (BUG - see Section 11)
- **No timeout protection:** Missing retry logic, HTTP timeout can silently fail

### Authentication Flow
- JWT in Authorization header (node backend)
- FastAPI DOES NOT authenticate (called by Node backend only)
- Frontend user must be authenticated to submit KYC

### Error Handling Strategy
- **FastAPI:** Returns 200 with error in response body (BAD PRACTICE)
- **Node:** Catches HTTP errors, returns empty result to frontend
- **Frontend:** Shows "Processing..." if data empty, no error message

### Validation Strategy
- **Frontend:** File type (image/jpeg, image/png), size (<10MB)
- **Backend:** Document type enum (CITIZENSHIP_FRONT, CITIZENSHIP_BACK, SELFIE)
- **FastAPI:** EasyOCR confidence threshold (0.3), fuzzy match threshold (50)

### State Management
- **Database:** Source of truth
- **ocrResult table:** Stores {rawText, extractedData JSON, confidence}
- **faceVerification table:** Stores {similarityScore, status, recommendation}
- **kycApplication table:** Stores prefilled OCR fields (ocrFullName, ocrCitizenshipNumber, etc.)

---

## 4. Backend Deep Context (FastAPI OCR Service)

### FastAPI Structure (backend-fastapi/app/services/ocr_service.py)

**Class: OCRProcessor**

```python
FIELD_KEYWORDS = {
    "name": ["नाम", "name", "नाम:"],
    "surname": ["थर", "surname", "थर:", "family name"],
    "dob": ["जन्म मिति", "date of birth", "dob", "जन्म:", "d.o.b"],
    "citizenship_number": ["नागरिकता नं", "citizenship no", "citizenship number", "नागरिकता:"],
    "gender": ["लिङ्ग", "sex", "gender", "लिङ्ग:"],
    "address": ["ठेगाना", "address", "address:", "ठेगाना:"],
    "father_name": ["बाबु", "father", "father name", "बाबु:"],
    "mother_name": ["आमा", "mother", "mother name", "आमा:"],
}

CONFIDENCE_THRESHOLD = 0.3   # Only keep text with >30% confidence
FUZZY_MATCH_THRESHOLD = 50   # Fuzzy match score must be >50
```

**Method: `process_image_async(image_path: str) → Dict`**
```
1. Load image from disk
   ├─ If not found → return error
2. Run sync processing in thread pool (non-blocking)
3. Return {raw_text, structured_data, confidence_score, language_detected, error?}
```

**Method: `_process_image_sync(image_path: str) → Dict`**
```
1. _preprocess_image()
   ├─ Convert to grayscale
   ├─ Resize if width > 720px (for low-spec devices)
   └─ Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
2. EasyOCR.readtext(preprocessed, detail=1)
   └─ Returns: [(bbox, text, confidence), ...]
3. _extract_raw_text()
   └─ Keep only text with confidence >= 0.3
4. _detect_language()
   ├─ Count Devnagri vs Latin characters
   └─ Return: "hi" (Hindi/Devnagri), "en" (English), or "mixed"
5. _structure_data(raw_lines, confidences)
   ├─ FOR each field (name, dob, citizenship_number, etc.):
   │  ├─ FOR each line in raw text:
   │  │  ├─ FOR each keyword for that field:
   │  │  │  └─ Fuzzy match line vs keyword → score
   │  │  └─ Keep best match if score > 50
   │  ├─ Extract value from line (after colon, or next line)
   │  └─ Add to structured_data
   └─ Calculate overall confidence (average of matched field confidences)
6. Return structured_data
```

**Method: `_extract_field_value(lines, line_index) → str`**
Logic to find the actual value given a keyword match:
```
1. Try next line (if not another keyword)
   └─ "name: John Doe" → next line is value
2. Try split by separator (:, -, =)
   └─ "name: John Doe" → parts[1] is value
3. Try split after keyword
   └─ "नाम John Doe" → after keyword is value
4. Fallback: return entire line
```

### FastAPI Endpoint: POST /api/v1/kyc/ocr/citizenship

**Input:**
```json
{
  "image_path": "uploads/kyc/abc123-citizenship-front.jpg",
  "document_type": "CITIZENSHIP_FRONT"
}
```

**Output:**
```json
{
  "extracted_data": {
    "name": "John Doe",
    "citizenship_number": "12345678",
    "dob": "2000-01-15",
    "gender": "Male",
    "address": "Kathmandu"
  },
  "raw_text": "Full OCR text...",
  "overall_confidence": 0.87,
  "language_detected": "mixed"
}
```

**Error Handling (PROBLEMATIC):**
```python
# FastAPI returns 200 even on error! (See bug Section 11)
except Exception as e:
    logger.error("Error processing image")
    return {
        "raw_text": "",
        "structured_data": {},
        "confidence_score": 0.0,
        "language_detected": "unknown",
        "error": str(e)
    }
```

### OCRService Class
```python
class OCRService:
    def __init__(self):
        self.processor = OCRProcessor(use_gpu=False, lang="hi")
    
    async def process_document(
        self, image_path: str, kyc_application_id: str, 
        document_type: str, session: AsyncSession
    ) → OCRResult:
        result = await self.processor.process_image_async(image_path)
        # Save to database
        ocr_record = OCRResult(...)
        session.add(ocr_record)
        return ocr_record
```

### Key Issues (See Section 11 for details)
1. **Timeout:** Node backend sets 30s timeout but no retry logic
2. **JSON emptiness:** If error occurs, frontend gets empty extractedData
3. **Language mixing:** Fuzzy match fails if field is partially Devnagri
4. **Low confidence:** Fields with <50% confidence silently dropped

---

## 5. Backend Deep Context (FastAPI Face Verification)

### FastAPI Structure (backend-fastapi/app/services/identity_service.py)

**Class: FaceVerificationService**

```python
MATCH_THRESHOLD = 0.4      # Distance < 0.4 = MATCH (FaceNet model)
MODEL = "Facenet"          # Faster than VGG-Face (5-10s vs 34s on CPU)
DETECTOR = "opencv"        # Face detector backend
```

**Method: `verify_face_match_async(selfie_path, id_document_path, kyc_application_id, session) → FaceVerification`**

```
1. Validate file paths exist
2. Run sync verification in thread pool
3. Return FaceVerification record with {distance, is_match, status, recommendation}
```

**Method: `_verify_face_match_sync(selfie_path, id_document_path) → Tuple[float, bool]`**

```
1. _detect_and_crop_face(id_document_path, label="ID document")
   ├─ Load image via OpenCV
   ├─ DeepFace.detectFace() → normalized face array [0-1]
   └─ Return cropped face normalized to [0-255]
2. _detect_and_crop_face(selfie_path, label="Selfie")
   └─ Just validate face exists (don't crop, use full image)
3. DeepFace.verify(selfie_path, id_face_crop, model="Facenet")
   ├─ Extract embeddings from both images
   └─ Return {distance, verified}
4. Determine match: is_match = (distance < MATCH_THRESHOLD)
5. Return (distance, is_match)
```

### FastAPI Endpoint: POST /api/v1/kyc/face/verify

**Input:**
```json
{
  "citizenship_photo": "uploads/kyc/abc123-citizenship-front.jpg",
  "selfie_photo": "uploads/kyc/abc123-selfie.jpg"
}
```

**Output:**
```json
{
  "similarity_score": 0.92,    // 1.0 - distance, higher = more similar
  "status": "MATCH",           // MATCH | MISMATCH | FAILED
  "recommendation": "APPROVE"  // APPROVE | REVIEW | REJECT
}
```

**Error Handling (Same Issue: 200 + error in body):**
```python
except Exception as e:
    logger.error("Face verification failed")
    raise ValueError(f"Face verification error: {str(e)}")
    # FastAPI catches and returns 500? Or 200 with error?
```

---

## 6. Backend Deep Context (Node.js Services)

### File: backend-node/src/services/ocrService.ts

```typescript
const FASTAPI_URL = 'http://localhost:8000';
const OCR_ENABLED = process.env.OCR_ENABLED !== 'false';  // Feature flag
const OCR_TIMEOUT_MS = 30000;    // 30 second timeout
const READY_CHECK_INTERVAL_MS = 2000;
const READY_MAX_WAIT_MS = 15000;

export const ocrService = {
  async extractCitizenshipData(
    imagePath: string, 
    documentType: string
  ): Promise<{
    extractedData: Record<string, any>;
    overallConfidence: number;
    rawText: string;
  }> {
    // Check OCR disabled
    if (!OCR_ENABLED) {
      return { extractedData: {}, overallConfidence: 0, rawText: '' };
    }

    // Wait for FastAPI models to load
    await waitForFastAPIReady();

    // Call FastAPI
    try {
      const response = await axios.post(
        `${FASTAPI_URL}/api/v1/kyc/ocr/citizenship`,
        { image_path: imagePath, document_type: documentType },
        { timeout: OCR_TIMEOUT_MS }
      );

      return {
        extractedData: response.data.extracted_data || {},
        overallConfidence: response.data.overall_confidence || 0,
        rawText: response.data.raw_text || ''
      };
    } catch (error) {
      logger.error('OCR extraction failed, returning empty result');
      return { extractedData: {}, overallConfidence: 0, rawText: '' };
    }
  }
};

async function waitForFastAPIReady(): Promise<void> {
  // Polls /ready endpoint up to 15s
  // Logs status but doesn't fail if models slow
}
```

### File: backend-node/src/services/faceService.ts

```typescript
const FASTAPI_URL = 'http://localhost:8000';
const FACE_MATCH_ENABLED = process.env.FACE_MATCH_ENABLED !== 'false';
const FACE_TIMEOUT_MS = 30000;

export const faceService = {
  async verifyFace(
    citizenshipPhotoPath: string,
    selfiePhotoPath: string
  ): Promise<{
    similarityScore: number;
    status: string;
    recommendation: string;
  }> {
    if (!FACE_MATCH_ENABLED) {
      return { similarityScore: 0, status: 'SKIPPED', recommendation: 'REVIEW' };
    }

    await waitForFastAPIReady();

    try {
      const response = await axios.post(
        `${FASTAPI_URL}/api/v1/kyc/face/verify`,
        {
          citizenship_photo: citizenshipPhotoPath,
          selfie_photo: selfiePhotoPath
        },
        { timeout: FACE_TIMEOUT_MS }
      );

      return {
        similarityScore: response.data.similarity_score ?? 0,
        status: response.data.status || 'UNKNOWN',
        recommendation: response.data.recommendation || 'REVIEW'
      };
    } catch (error) {
      logger.error('Face verification failed, returning review recommendation');
      return { similarityScore: 0, status: 'FAILED', recommendation: 'REVIEW' };
    }
  }
};
```

### File: backend-node/src/services/kycVerificationService.ts

**Purpose:** Generate verification report comparing OCR + face scores

```typescript
export const kycVerificationService = {
  async generateVerificationReport(kycApplicationId: string): Promise<any> {
    const kyc = await prisma.kycApplication.findUnique({
      where: { id: kycApplicationId },
      include: { ocrResults: true, faceVerification: true }
    });

    // Calculate scores
    const faceScore = kyc.faceVerification?.similarityScore || 0;
    const ocrScore = kyc.ocrResults?.[0]?.overallConfidence || 0;
    
    const facePercentage = faceScore * 100;
    const ocrPercentage = ocrScore * 100;

    // Recommendation logic
    const manualReviewSuggested =
      ocrPercentage < 80 ||      // Low OCR confidence
      facePercentage < 85 ||     // Low face similarity
      possibleMismatches.length > 0;  // User corrected fields

    // Upsert report
    return await prisma.verificationReport.upsert({
      where: { kycApplicationId },
      update: { faceSimilarity: faceScore, ocrConfidence: ocrScore, ... },
      create: { kycApplicationId, faceSimilarity: faceScore, ... }
    });
  }
};
```

### Key Integration Points

**Where OCR/Face are called:** `kycController.submitKyc()` (line ~2576)

```typescript
// After sending 200 response to frontend:
setImmediate(async () => {
  try {
    // Extract document paths
    const frontDoc = result.documents.find(d => d.type === 'CITIZENSHIP_FRONT');
    const selfieDoc = result.documents.find(d => d.type === 'SELFIE');

    // OCR
    if (frontDoc && OCR_ENABLED) {
      const frontPath = resolveAbsolutePath(frontDoc.filePath);
      const ocrFront = await ocrService.extractCitizenshipData(frontPath, 'CITIZENSHIP_FRONT');
      
      // Store result
      await prisma.ocrResult.create({
        data: {
          kycApplicationId: result.id,
          documentType: 'CITIZENSHIP_FRONT',
          rawOcrText: ocrFront.rawText,
          extractedData: ocrFront.extractedData,
          overallConfidence: ocrFront.overallConfidence
        }
      });

      // Prefill KYC fields
      const prefill: any = {};
      if (ocrFront.extractedData.name) prefill.ocrFullName = ocrFront.extractedData.name;
      if (ocrFront.extractedData.citizenship_number) prefill.ocrCitizenshipNumber = ocrFront.extractedData.citizenship_number;
      // ... etc

      await prisma.kycApplication.update({
        where: { id: result.id },
        data: prefill
      });
    }

    // Face verification
    if (frontDoc && selfieDoc && FACE_MATCH_ENABLED) {
      const faceResult = await faceService.verifyFace(frontPath, selfiePath);
      
      await prisma.faceVerification.upsert({
        where: { kycApplicationId: result.id },
        update: { similarityScore: faceResult.similarityScore, ... },
        create: { kycApplicationId: result.id, ... }
      });
    }

    logger.info('Background OCR/face processing complete');
  } catch (bgError) {
    logger.error('Background OCR/face processing failed');
  }
});
```

---

## 7. Database Schema

### OcrResult Table
```prisma
model OcrResult {
  id String @id @default(cuid())
  kycApplicationId String
  kyc KycApplication @relation(fields: [kycApplicationId], references: [id])
  
  documentType String  // CITIZENSHIP_FRONT, CITIZENSHIP_BACK
  rawOcrText String?   // Full extracted text
  extractedData Json   // {name, citizenship_number, dob, gender, address, ...}
  overallConfidence Float
  languageDetected String?  // hi, en, mixed, unknown
  
  createdAt DateTime @default(now())
  
  @@index([kycApplicationId])
}
```

### FaceVerification Table
```prisma
model FaceVerification {
  id String @id @default(cuid())
  kycApplicationId String @unique
  kyc KycApplication @relation(fields: [kycApplicationId], references: [id])
  
  citizenshipPhotoPath String
  selfiePhotoPath String
  distance Float?
  is_match Boolean?
  similarityScore Float   // 1.0 - distance
  status String          // MATCH, MISMATCH, FAILED, SKIPPED
  recommendation String  // APPROVE, REVIEW, REJECT
  modelUsed String?      // Facenet
  
  createdAt DateTime @default(now())
}
```

### KycApplication Table (relevant fields)
```prisma
model KycApplication {
  id String @id
  userId String
  status String  // PENDING, UNDER_REVIEW, APPROVED, REJECTED
  
  // Prefilled from OCR
  ocrFullName String?
  ocrCitizenshipNumber String?
  ocrDateOfBirth String?
  ocrGender String?
  ocrAddress String?
  
  // User confirmed values
  confirmedFullName String?
  confirmedCitizenshipNumber String?
  confirmedDateOfBirth String?
  confirmedGender String?
  confirmedAddress String?
  confirmedPhoneNumber String?
  confirmedEmail String?
  
  // Relations
  documents Document[]
  ocrResults OcrResult[]
  faceVerification FaceVerification?
  verificationReport VerificationReport?
  
  createdAt DateTime @default(now())
}
```

---

## 8. Frontend Deep Context (React)

### Feature Structure: features/kyc/

**useKyc Hook** (features/kyc/hooks/useKyc.ts)
```typescript
export const useKyc = () => {
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [uploadDocument, setUploadDocument] = useState<Function>();
  const [verifyFace, setVerifyFace] = useState<Function>();

  // POST /api/v1/kyc/submit
  // GET /api/v1/kyc/status (poll for OCR/face results)
  // GET /api/v1/kyc/get-verification-report/{kycId}
};
```

### Components Flow

**Step 1: Upload**
- User uploads citizenship_front, citizenship_back, selfie
- POST /api/v1/kyc/submit
- Response: Kyc created (but OCR/face might be processing in background)

**Step 2: Processing**
- Step2Processing.tsx shows spinner
- Poll GET /api/v1/kyc/status every 2-3 seconds
- Wait for ocrResults + faceVerification to populate

**Step 3: Review OCR Fields**
- Step3Review.tsx shows extracted fields:
  - Full Name (editable if low confidence)
  - Citizenship Number
  - Date of Birth
  - Gender
  - Address
- User can correct any field

**Step 4: Face Result**
- Step4FaceResult.tsx shows:
  - Face similarity score (e.g., "92%")
  - Match status (MATCH | MISMATCH | REVIEW)
  - Recommendation (APPROVE | REVIEW | REJECT)

**Step 5: Confirm & Submit**
- POST /api/v1/kyc/submit-confirmed-data with user-corrected fields
- Generates kycVerificationService report
- KYC ready for admin review

---

## 9. Important Files Map

| File | Purpose | When to Modify | Dependencies |
|------|---------|----------------|--------------|
| backend-fastapi/app/services/ocr_service.py | EasyOCR processing | Adjust thresholds, add fields, fix fuzzy logic | FastAPI models, EasyOCR |
| backend-fastapi/app/services/identity_service.py | DeepFace face matching | Adjust threshold (0.4), optimize for low-spec devices | DeepFace, OpenCV |
| backend-fastapi/app/api/v1/endpoints/kyc.py | OCR/face FastAPI routes | Add endpoints, fix path resolution, error handling | OCR/face services |
| backend-node/src/services/ocrService.ts | Node client to FastAPI OCR | Change timeout (30s), add retry logic, fix empty JSON bug | Axios, FASTAPI_URL |
| backend-node/src/services/faceService.ts | Node client to FastAPI face | Change timeout, improve error handling | Axios, FASTAPI_URL |
| backend-node/src/services/kycVerificationService.ts | Generate verification report | Adjust thresholds (80% OCR, 85% face), scoring logic | Prisma, report table |
| backend-node/src/controllers/kycController.ts | submitKyc (triggers background processing) | Fix setImmediate error handling, add retries | All services |
| backend-node/prisma/schema.prisma | Database models | Add new OCR fields, new verification fields | Migrations |
| frontend/src/features/kyc/components/Step2Processing.tsx | OCR/face progress UI | Add progress bars, loading states, error messages | useKyc hook |
| frontend/src/features/kyc/components/Step3Review.tsx | Field confirmation UI | Add field validation, confidence color coding | useKyc hook |

---

## 10. Development Rules (OCR/Face Specific)

### Naming
- **Functions:** `extractCitizenshipData()`, `verifyFace()`, `process_image_async()`
- **Files:** `ocrService.ts`, `identityService.py`, `Step2Processing.tsx`
- **Variables:** `ocrFront`, `faceResult`, `similarityScore`, `extractedData`
- **Database fields:** `ocrFullName`, `confirmedFullName`, `extractedData` (JSON)

### Folder Placement
- **FastAPI services:** `backend-fastapi/app/services/{ocr_service.py, identity_service.py}`
- **Node services:** `backend-node/src/services/{ocrService.ts, faceService.ts}`
- **React steps:** `frontend/src/features/kyc/components/Step{N}*.tsx`
- **Hooks:** `frontend/src/features/kyc/hooks/useKyc.ts`

### API Patterns
- **POST /api/v1/kyc/ocr/citizenship:** Node → FastAPI, returns extractedData JSON
- **POST /api/v1/kyc/face/verify:** Node → FastAPI, returns similarityScore
- **GET /api/v1/kyc/status:** Frontend polls this to check OCR/face progress
- **POST /api/v1/kyc/submit-confirmed-data:** Frontend sends corrected fields to backend

### Error Handling
```typescript
// Node -> FastAPI error pattern
try {
  const response = await axios.post(endpoint, data, { timeout: 30000 });
  return response.data;
} catch (error) {
  logger.error('Operation failed');
  return { extractedData: {}, overallConfidence: 0, rawText: '' }; // EMPTY FALLBACK
}

// DO NOT return partial data - return empty or error
```

### Type Usage
```typescript
// Proper types for OCR result
interface OcrResult {
  extractedData: Record<string, any>;  // {name, citizenship_number, dob, ...}
  overallConfidence: number;           // 0.0 to 1.0
  rawText: string;
}

// Face result
interface FaceResult {
  similarityScore: number;  // 0.0 to 1.0
  status: string;          // MATCH | MISMATCH | FAILED | SKIPPED
  recommendation: string;  // APPROVE | REVIEW | REJECT
}
```

---

## 11. Known Issues & Bugs (CRITICAL - Must Fix)

### Bug #1: Empty JSON on OCR Failure

**Problem:**
- If FastAPI OCR fails (timeout, no text detected), ocrService returns empty object
- Frontend polls and gets `{ extractedData: {}, confidence: 0 }`
- UI shows "Processing..." forever - no error message

**Current Code (ocrService.ts, line ~5152):**
```typescript
catch (error: any) {
  logger.error('OCR extraction failed, returning empty result');
  return { extractedData: {}, overallConfidence: 0, rawText: '' };  // EMPTY!
}
```

**Fix Required:**
1. Don't silently fail - set error flag in response
2. Frontend must detect error state and show message
3. Log error details for debugging
4. Retry with backoff (2 retries max)

**Solution Template:**
```typescript
return {
  extractedData: {},
  overallConfidence: 0,
  rawText: '',
  error: 'OCR processing failed: ' + error.message,  // ADD THIS
  retryable: true,  // Can frontend retry?
  timestamp: Date.now()
};
```

### Bug #2: No Timeout Handling (30 seconds is too short)

**Problem:**
- Node sets 30s timeout for OCR/face calls
- EasyOCR can take 20-25s even on decent hardware
- Low-spec devices timeout and fail silently

**Current Timeouts:**
- OCR: 30,000ms (30s)
- Face: 30,000ms (30s)
- Ready check: 15,000ms (15s max wait)

**Fix Required:**
1. Increase timeouts: OCR to 60s, Face to 45s
2. Add retry logic with exponential backoff
3. Add progress callback to know it's still processing

**Solution Template:**
```typescript
const OCR_TIMEOUT_MS = 60000;  // 60 seconds
const RETRY_MAX = 2;
const RETRY_DELAY_MS = 5000;

async function callOcrWithRetry(imagePath: string, documentType: string, retryCount = 0): Promise<any> {
  try {
    return await axios.post(endpoint, data, { timeout: OCR_TIMEOUT_MS });
  } catch (error) {
    if (retryCount < RETRY_MAX && isRetryable(error)) {
      await delay(RETRY_DELAY_MS);
      return callOcrWithRetry(imagePath, documentType, retryCount + 1);
    }
    throw error;
  }
}
```

### Bug #3: Background Processing Error Not Reported

**Problem:**
- `setImmediate()` catches errors but doesn't report to frontend
- Frontend has no way to know OCR failed
- User stuck in "Processing" state

**Current Code (kycController.ts, line ~2632):**
```typescript
setImmediate(async () => {
  try { /* ... OCR/face calls ... */ }
  catch (bgError) {
    logger.error('Background OCR/face processing failed');  // Only logs!
  }
});
```

**Fix Required:**
1. Store error status in database
2. Frontend polls kycStatus and gets error details
3. Show user-friendly message

**Solution:**
```typescript
// Store error in KYC record
await prisma.kycApplication.update({
  where: { id: result.id },
  data: { 
    ocrProcessingError: bgError.message,
    ocrProcessingRetries: 0,
    processingStatus: 'FAILED'  // New field
  }
});

// Frontend checks in getKycStatus:
if (kyc.processingStatus === 'FAILED') {
  return { error: kyc.ocrProcessingError, status: 'FAILED' };
}
```

### Bug #4: Fuzzy Matching Too Aggressive

**Problem:**
- Fuzzy threshold = 50 is too low for short keywords
- Matches wrong fields (e.g., "address" matches "ad" in random text)
- Extracted values are garbage

**Current Logic (ocr_service.py, line ~1363):**
```python
score = fuzz.token_set_ratio(keyword.lower(), line.lower())
if score > best_score and score > self.FUZZY_MATCH_THRESHOLD:  # 50
```

**Fix Required:**
- Use `fuzz.token_set_ratio` only for multi-word fields
- Use exact substring match for short keywords
- Increase threshold to 70 for short keywords

**Solution:**
```python
def _find_field_in_text(self, keyword, line):
    # Exact match for short keywords
    if len(keyword) <= 5:
        return keyword.lower() in line.lower()
    
    # Fuzzy match for longer keywords
    score = fuzz.token_set_ratio(keyword.lower(), line.lower())
    return score > 70  # Stricter threshold
```

### Bug #5: Devnagri Text Not Fully Extracted

**Problem:**
- Some Devnagri characters are skipped in OCR extraction
- EasyOCR sometimes returns partial text for mixed-script fields
- Citizenship numbers often missed if in Devnagri + English mix

**Fix Required:**
- Run separate passes for Devnagri and English
- Combine results intelligently
- Validate citizenship number format (must be exactly 11 digits)

**Solution:**
```python
# Separate extraction for mixed scripts
devanagari_text = " ".join([t for t, c in ocr_results if is_devanagari(t)])
english_text = " ".join([t for t, c in ocr_results if is_english(t)])

# Try to extract citizenship from both
citizenship = extract_citizenship_number(devanagari_text) or extract_citizenship_number(english_text)
if not citizenship or not re.match(r'^\d{11}$', citizenship):
  citizenship = None  # Invalid
```

### Bug #6: Face Matching on Low-Spec Devices Fails

**Problem:**
- DeepFace on CPU without GPU can timeout
- Face detection fails if image quality is poor
- No fallback strategy

**Current Logic (identity_service.py, line ~1088):**
```python
MODEL = "Facenet"  # Faster (5-10s) but still slow on old devices
DETECTOR = "opencv"  # Can fail on blurry images
```

**Fix Required:**
1. Add image quality check before face matching
2. Use VGG-Face with retry only if Facenet fails
3. Return confidence score for recommendation

**Solution:**
```python
def _verify_face_match_sync(self, selfie_path: str, id_document_path: str):
    # Check image quality first
    selfie_quality = self._estimate_image_quality(selfie_path)
    id_quality = self._estimate_image_quality(id_document_path)
    
    if selfie_quality < 0.3 or id_quality < 0.3:
        return (0.0, False)  # Low quality - cannot match
    
    try:
        # Fast matching with Facenet
        result = DeepFace.verify(..., model_name="Facenet", ...)
    except Exception:
        # Fallback to slower but more robust VGG-Face
        result = DeepFace.verify(..., model_name="VGG-Face", ...)
    
    return (result["distance"], result["distance"] < self.match_threshold)

def _estimate_image_quality(self, image_path: str) -> float:
    # Check for: blur, brightness, size, face visibility
    # Return 0.0 (bad) to 1.0 (excellent)
    pass
```

### Bug #7: No Progress Indication

**Problem:**
- Frontend polls `/status` but never knows current progress
- User waits with no feedback on what's happening
- ETAs are unknown

**Fix Required:**
- Add progress fields to KYC response
- Track: ocr_front (processing|done|failed), ocr_back, face_verify

**Solution:**
```typescript
// In getKycStatus response:
{
  status: 'UNDER_REVIEW',
  processing: {
    ocr_front: { status: 'PROCESSING', progress: 60 },
    ocr_back: { status: 'PENDING' },
    face_verify: { status: 'PENDING' }
  },
  estimatedTime: 45000  // 45 seconds remaining
}
```

---

## 12. Common Tasks Guide

### Task: Fix OCR Empty JSON Bug

1. **Find:** Node fails silently in ocrService.ts
   - Check line ~5152 (catch block returns empty object)

2. **Identify:** Frontend never gets error signal
   - Check Step2Processing.tsx (polls forever)

3. **Fix Step 1:** Add error field to response
   ```typescript
   return {
     extractedData: {},
     overallConfidence: 0,
     error: 'FastAPI timeout after 30s',
     timestamp: Date.now()
   };
   ```

4. **Fix Step 2:** Frontend detects error
   ```typescript
   if (kycStatus.processingError) {
     showErrorToast(kycStatus.processingError);
     return <ErrorMessage />;
   }
   ```

5. **Test:** Upload low-quality image, verify error shown in 30s

### Task: Increase OCR Timeout for Low-Spec Devices

1. Open `backend-node/src/services/ocrService.ts`
2. Change `OCR_TIMEOUT_MS` from 30000 to 60000
3. Change `OCR_ENABLED` check to log why disabled if false
4. Test with slow device: should take 45s, not timeout at 30s

### Task: Add Fuzzy Match Validation

1. Open `backend-fastapi/app/services/ocr_service.py`
2. Find `_structure_data()` method (line ~1352)
3. Change fuzzy threshold from 50 to 70 for short keywords
4. Add exact match for keywords < 5 chars
5. Test with scanned citizenship: should extract more correctly

### Task: Add Progress Tracking to Frontend

1. Open `backend-node/src/services/kycService.ts`
2. Add fields to KYC response:
   ```typescript
   {
     processingStatus: 'PROCESSING',  // PENDING | PROCESSING | DONE | FAILED
     ocrFrontStatus: 'PROCESSING',
     faceMergeStatus: 'PENDING'
   }
   ```

3. Update Step2Processing.tsx to show statuses
4. Test: Upload docs, watch progress change from PENDING → PROCESSING → DONE

### Task: Debug Why Face Matching Fails

1. Check `backend-fastapi/app/services/identity_service.py`
2. Add logging:
   ```python
   logger.info(f"Detecting face in {label}")
   face_crop = DeepFace.detectFace(...)
   logger.info(f"Face detected. Shape: {face_crop.shape}")
   ```

3. Check logs for where it fails:
   - "Detecting face..." but no "Face detected" → detection failed
   - Detection worked but verify failed → embedding mismatch

4. If low-spec device, increase timeout and try VGG-Face fallback

### Task: Validate Extracted Citizenship Number

1. Open `backend-fastapi/app/services/ocr_service.py`
2. Add validation in `_extract_field_value()`:
   ```python
   if field_name == "citizenship_number":
       # Must be 11 digits
       if not re.match(r'^\d{11}$', value):
           logger.warn(f"Invalid citizenship number: {value}")
           return None
   ```

3. Don't include invalid values in `extractedData`
4. Frontend shows as "Not detected" if missing

---

## 13. Running KYC OCR Locally

### Start FastAPI (Python)
```bash
cd backend-fastapi
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
# Download EasyOCR + DeepFace models on first run (takes 5-10 min)
python main.py
# FastAPI runs on http://localhost:8000
# Check /docs for Swagger
```

### Start Node Backend
```bash
cd backend-node
npm install
npx prisma migrate dev  # Create database
npm run dev
# Runs on http://localhost:5000
```

### Start React Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Test KYC Submission
1. Create user account (login)
2. Go to KYC submission
3. Upload citizenship_front + citizenship_back + selfie images
4. Watch network tab for POST /api/v1/kyc/submit
5. Check browser console for polling GET /api/v1/kyc/status
6. Wait 30-60s for OCR/face to complete
7. Check database: `SELECT * FROM OcrResult WHERE kycApplicationId = '...'`
8. Verify extractedData is populated

---

## 14. Environment Variables

### FastAPI (.env or system vars)
```bash
TF_USE_LEGACY_KERAS=1              # Required for DeepFace compatibility
FASTAPI_PORT=8000
LOG_LEVEL=INFO
```

### Node Backend (.env)
```bash
FASTAPI_URL=http://localhost:8000   # FastAPI service address
OCR_ENABLED=true                    # Feature flag for OCR
FACE_MATCH_ENABLED=true             # Feature flag for face verification
OCR_TIMEOUT_MS=30000                # ⚠️ Too short - should be 60000
FACE_TIMEOUT_MS=30000               # ⚠️ Too short - should be 45000
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 15. Debugging Checklist

If OCR returns empty `extractedData`:

- [ ] FastAPI is running: `curl http://localhost:8000/ready`
- [ ] Models loaded: Check FastAPI logs for "Models ready"
- [ ] Document image exists: Verify file path in database
- [ ] Image is valid: Try opening in image viewer
- [ ] Image has text: Not completely blank
- [ ] Timeout error? Check Node logs for "timeout"
- [ ] FastAPI error? Check FastAPI logs for exceptions
- [ ] Fuzzy threshold too high? Lower from 50 to 30 temporarily
- [ ] Language detection wrong? Check `language_detected` field

If face matching fails:

- [ ] Both images exist: Verify citizenship + selfie paths
- [ ] Faces visible: Check image quality, not too small
- [ ] No sunglasses/mask: Face must be clearly visible
- [ ] Good lighting: Dark images fail detection
- [ ] Low-spec device? Check if timeout (30s) vs actual failure
- [ ] Try VGG-Face fallback: Slower but more robust
- [ ] Threshold too strict? Currently 0.4, try lowering to 0.35

---

## 16. Key Data Structures

### OCRResult JSON Example
```json
{
  "id": "uuid",
  "kycApplicationId": "kyc-uuid",
  "documentType": "CITIZENSHIP_FRONT",
  "rawOcrText": "नाम John Doe\nजन्म मिति 2000-01-15\n...",
  "extractedData": {
    "name": "John Doe",
    "citizenship_number": "12345678901",
    "dob": "2000-01-15",
    "gender": "Male",
    "address": "Kathmandu, Nepal",
    "father_name": "Ram Doe",
    "mother_name": "Sita Doe"
  },
  "overallConfidence": 0.87,
  "languageDetected": "mixed"
}
```

### FaceVerification JSON Example
```json
{
  "id": "uuid",
  "kycApplicationId": "kyc-uuid",
  "citizenshipPhotoPath": "uploads/kyc/xxx-citizenship-front.jpg",
  "selfiePhotoPath": "uploads/kyc/xxx-selfie.jpg",
  "distance": 0.32,
  "is_match": true,
  "similarityScore": 0.68,
  "status": "MATCH",
  "recommendation": "APPROVE",
  "modelUsed": "Facenet"
}
```

### VerificationReport JSON Example
```json
{
  "kycApplicationId": "kyc-uuid",
  "faceSimilarity": 0.68,
  "ocrConfidence": 0.87,
  "fieldsCorrected": 1,
  "possibleMismatches": ["Address"],
  "manualReviewSuggested": false,
  "report": "{...}"
}
```

---

## 17. Thresholds & Magic Numbers

| Threshold | Value | Purpose | Tunable? |
|-----------|-------|---------|----------|
| OCR confidence | 0.3 | Keep text with >30% confidence | ✅ Lower for poor images |
| Fuzzy match | 50 | Field keyword match score | ✅ Increase to 70 (stricter) |
| Face match distance | 0.4 | FaceNet model threshold | ✅ Lower to 0.35 (stricter) |
| OCR timeout | 30s | Max time to wait for OCR | ✅ Increase to 60s |
| Face timeout | 30s | Max time to wait for face match | ✅ Increase to 45s |
| Ready check timeout | 15s | Max time to wait for FastAPI startup | ✅ Increase to 30s |
| Report OCR threshold | 80% | Trigger manual review if <80% | ✅ Adjust |
| Report face threshold | 85% | Trigger manual review if <85% | ✅ Adjust |

---

## 18. Future Improvements

### Short-term
1. Fix Bug #1: Empty JSON error handling
2. Fix Bug #2: Increase timeouts
3. Add progress tracking (Bug #7)

### Medium-term
1. Add image quality validation before OCR
2. Optimize EasyOCR for Devnagri script
3. Add local caching for models (faster startup)

### Long-term
1. Replace EasyOCR with Tesseract + custom preprocessing
2. Use liveness detection in face verification
3. Add batch processing for admin uploads
4. Multiprocessing for parallel OCR (current is single-threaded)

---

**END OF KYCOCR.MD**

This document is the authority on KYC OCR & face verification. Refer to it when debugging timeouts, empty JSON results, or face matching failures. Update it when you fix bugs or change thresholds.

