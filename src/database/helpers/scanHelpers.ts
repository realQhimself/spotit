/**
 * Scan CRUD helper functions using WatermelonDB.
 */

import database, { Scan, ScanDetection } from '../index';

const scansCollection = database.get<Scan>('scans');
const scanDetectionsCollection = database.get<ScanDetection>('scan_detections');

// ── Types ──────────────────────────────────────────────────────────────

export interface CreateScanData {
  roomId: string;
  zoneId?: string | null;
  scanType: string;
  photoUri?: string | null;
  photoCloudUrl?: string | null;
  annotatedPhotoUri?: string | null;
}

export interface CreateScanDetectionData {
  scanId: string;
  itemId?: string | null;
  yoloClass: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  cloudAiResult?: string | null;
  status?: string;
}

// ── Create ─────────────────────────────────────────────────────────────

/**
 * Create a new scan record in the database.
 *
 * @param data - Scan fields. `roomId` and `scanType` are required.
 * @returns The newly created Scan model instance.
 */
export async function createScan(data: CreateScanData): Promise<Scan> {
  return database.write(async () => {
    return scansCollection.create((scan) => {
      scan.roomId = data.roomId;
      scan.zoneId = data.zoneId ?? null;
      scan.scanType = data.scanType;
      scan.photoUri = data.photoUri ?? null;
      scan.photoCloudUrl = data.photoCloudUrl ?? null;
      scan.annotatedPhotoUri = data.annotatedPhotoUri ?? null;
      scan.detectionCount = 0;
      scan.status = 'processing';
    });
  });
}

/**
 * Create a new scan detection record and link it to a scan and optionally an item.
 *
 * @param data - Scan detection fields.
 * @returns The newly created ScanDetection model instance.
 */
export async function createScanDetection(
  data: CreateScanDetectionData,
): Promise<ScanDetection> {
  return database.write(async () => {
    return scanDetectionsCollection.create((detection) => {
      detection.scanId = data.scanId;
      detection.itemId = data.itemId ?? null;
      detection.yoloClass = data.yoloClass;
      detection.confidence = data.confidence;
      detection.bbox = JSON.stringify(data.bbox);
      detection.cloudAiResult = data.cloudAiResult ?? null;
      detection.status = data.status ?? 'pending';
    });
  });
}

// ── Update ─────────────────────────────────────────────────────────────

/**
 * Mark a scan as completed with the final detection count.
 *
 * @param scanId - WatermelonDB record ID of the scan.
 * @param detectionCount - Number of detections that were saved.
 */
export async function completeScan(
  scanId: string,
  detectionCount: number,
): Promise<void> {
  const scan = await scansCollection.find(scanId);
  await scan.completeScan(detectionCount);
}

/**
 * Mark a scan as failed.
 *
 * @param scanId - WatermelonDB record ID of the scan.
 */
export async function failScan(scanId: string): Promise<void> {
  const scan = await scansCollection.find(scanId);
  await scan.failScan();
}

// ── Delete ─────────────────────────────────────────────────────────────

/**
 * Delete a scan and all its associated detections.
 *
 * @param scanId - WatermelonDB record ID of the scan to delete.
 */
export async function deleteScan(scanId: string): Promise<void> {
  const scan = await scansCollection.find(scanId);
  await scan.markAsDeleted();
}
