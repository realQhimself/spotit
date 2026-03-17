/**
 * App-wide constants for the SpotIt app.
 */

// ── API endpoints (placeholders — set real values in env / config) ──────
export const API = {
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  /** Placeholder base URL for a future SpotIt backend. */
  BACKEND_BASE_URL: 'https://api.spotit.app',
} as const;

// ── Scan / detection settings ───────────────────────────────────────────
export const SCAN = {
  /** Minimum confidence to keep a detection. */
  CONFIDENCE_THRESHOLD: 0.4,
  /** IoU threshold for non-max suppression. */
  NMS_IOU_THRESHOLD: 0.45,
  /** Cap on the number of detections per frame / photo. */
  MAX_DETECTIONS: 20,
  /** JPEG quality when capturing a photo for detection (0-1). */
  CAPTURE_QUALITY: 0.85,
} as const;

// ── Item categories ─────────────────────────────────────────────────────
export const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Clothing',
  'Kitchen',
  'Books',
  'Tools',
  'Toys',
  'Sports',
  'Decor',
  'Personal',
  'Office',
  'Bathroom',
  'Garden',
  'Automotive',
  'Miscellaneous',
] as const;

export type Category = (typeof CATEGORIES)[number];

// ── Misc ────────────────────────────────────────────────────────────────
export const MAX_RECENT_SEARCHES = 10;
