/**
 * Type definitions related to object detection and item enrichment.
 */

// ── Bounding box from YOLO / detection model ────────────────────────────
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Single detection result ─────────────────────────────────────────────
export type EnrichmentStatus = 'pending' | 'enriching' | 'enriched' | 'failed';

export interface Detection {
  id: string;
  classId: number;
  className: string;
  confidence: number;
  bbox: BoundingBox;
  enrichmentStatus?: EnrichmentStatus;
  enrichment?: EnrichmentResult;
}

// ── Enrichment result from Gemini API ───────────────────────────────────
export interface EnrichmentResult {
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

// ── Scan session ────────────────────────────────────────────────────────
export type ScanType = 'quick' | 'room' | 'area';
export type ScanStatus = 'capturing' | 'detecting' | 'enriching' | 'complete' | 'error';

export interface ScanSession {
  id: string;
  roomId?: string;
  zoneId?: string;
  scanType: ScanType;
  photoUri?: string;
  detections: Detection[];
  status: ScanStatus;
  createdAt: string;
}

// ── Search result ───────────────────────────────────────────────────────
export type MatchType = 'name' | 'category' | 'tag' | 'description' | 'location';

export interface SearchResult {
  itemId: string;
  name: string;
  category: string;
  roomName: string;
  zoneName?: string;
  layer?: string;
  thumbnailUri?: string;
  relevanceScore: number;
  matchType: MatchType;
}
