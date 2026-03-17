/**
 * API request/response types for the SpotIt enrichment pipeline.
 */

// ── Gemini enrichment API ───────────────────────────────────────────────

/** Payload sent to the Gemini Vision API for item enrichment. */
export interface GeminiRequest {
  /** Base-64 encoded JPEG of the cropped detection. */
  imageBase64: string;
  /** MIME type of the image (e.g. "image/jpeg"). */
  mimeType: string;
  /** The YOLO class label for additional context. */
  detectedClassName: string;
  /** Optional prompt override. */
  prompt?: string;
}

/** Structured enrichment data returned by the Gemini API. */
export interface GeminiResponse {
  name: string;
  category: string;
  subcategory: string;
  brand?: string;
  color: string;
  material: string;
  sizeEstimate: string;
  description: string;
  tags: string[];
}

// ── Generic API helpers ─────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
