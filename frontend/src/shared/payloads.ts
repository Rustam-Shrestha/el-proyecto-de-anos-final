/**
 * Shared payload contracts — MIRROR of `backend-node/src/shared/payloads.ts`.
 *
 * Plain copy, no workspace dependency, so the frontend still builds and
 * deploys standalone. When a shape changes in the backend file, update this
 * mirror in the same commit.
 */

/** Backend API success envelope (see backend `utils/apiResponse`). */
export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data?: T;
  statusCode: number;
}

/** Backend API error envelope. */
export interface ApiErrorEnvelope {
  success: false;
  message: string;
  statusCode: number;
  details?: unknown;
}

/** FastAPI OCR wire shape (flat dict, snake_case). */
export interface FastApiOcrResponse {
  full_text?: unknown;
  confidence?: unknown;
  text_lines?: unknown;
  status?: unknown;
  message?: unknown;
}

/** FastAPI extract-document wire shape (unified schema, camelCase). */
export interface FastApiExtractionResponse {
  sourceType?: unknown;
  extractionMethod?: unknown;
  bankMeta?: unknown;
  transactions?: unknown;
  parsingConfidence?: unknown;
  needsManualMapping?: unknown;
  rawExtractedText?: unknown;
  rawTableData?: unknown;
  status?: unknown;
  message?: unknown;
}

/** Chat message roles (canonical uppercase on the wire). */
export type ChatRole = 'USER' | 'ASSISTANT';

export interface ChatMessagePayload {
  role: ChatRole;
  content: string;
  timestamp: string;
}

/** Notification priority levels accepted by the backend. */
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
