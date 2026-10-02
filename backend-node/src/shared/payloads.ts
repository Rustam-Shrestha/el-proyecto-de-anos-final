/**
 * Shared payload contracts — single source of truth for cross-boundary shapes.
 *
 * The frontend mirrors these in `frontend/src/shared/payloads.ts` (plain copy,
 * no workspace dependency, so each app still builds and deploys standalone).
 * When a shape changes here, update the mirror in the same commit.
 */

/** Our own API envelope (see backend `utils/apiResponse`). */
export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data?: T;
  statusCode: number;
}

/** Our own API error envelope. */
export interface ApiErrorEnvelope {
  success: false;
  message: string;
  statusCode: number;
  details?: unknown;
}

/** FastAPI `/kyc/ocr/citizenship` + `/financial/ocr` wire shape (flat dict, snake_case). */
export interface FastApiOcrResponse {
  full_text?: unknown;
  confidence?: unknown;
  text_lines?: unknown;
  status?: unknown;
  message?: unknown;
}

/** FastAPI `/financial/ocr/extract-document` wire shape (unified schema, camelCase). */
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

/** Notification priority levels accepted by `notificationService.create`. */
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
