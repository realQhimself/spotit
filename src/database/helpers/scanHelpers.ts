/**
 * Scan CRUD helper functions using WatermelonDB.
 */

import { Q } from '@nozbe/watermelondb';
import type { Observable } from 'rxjs';
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

// ── Read ──────────────────────────────────────────────────────────────

export function getRecentScans(limit = 10): Observable<Scan[]> {
  return scansCollection
    .query(Q.sortBy('created_at', Q.desc), Q.take(limit))
    .observe();
}

export function getScansByRoom(roomId: string): Observable<Scan[]> {
  return scansCollection
    .query(Q.where('room_id', roomId), Q.sortBy('created_at', Q.desc))
    .observe();
}

export async function getScanById(scanId: string): Promise<Scan> {
  return scansCollection.find(scanId);
}

export function getDetectionsByScan(scanId: string): Observable<ScanDetection[]> {
  return scanDetectionsCollection
    .query(Q.where('scan_id', scanId))
    .observe();
}

export async function getScanCount(): Promise<number> {
  return scansCollection.query().fetchCount();
}

export async function getScanCountByRoom(roomId: string): Promise<number> {
  return scansCollection.query(Q.where('room_id', roomId)).fetchCount();
}

// ── Update ─────────────────────────────────────────────────────────────

export async function completeScan(
  scanId: string,
  detectionCount: number,
): Promise<void> {
  const scan = await scansCollection.find(scanId);
  await scan.completeScan(detectionCount);
}

export async function failScan(scanId: string): Promise<void> {
  const scan = await scansCollection.find(scanId);
  await scan.failScan();
}

export async function updateScan(
  scanId: string,
  updates: Partial<Pick<Scan, 'photoUri' | 'photoCloudUrl' | 'annotatedPhotoUri' | 'status'>>,
): Promise<void> {
  await database.write(async () => {
    const scan = await scansCollection.find(scanId);
    await scan.update((s) => {
      if (updates.photoUri !== undefined) s.photoUri = updates.photoUri;
      if (updates.photoCloudUrl !== undefined) s.photoCloudUrl = updates.photoCloudUrl;
      if (updates.annotatedPhotoUri !== undefined) s.annotatedPhotoUri = updates.annotatedPhotoUri;
      if (updates.status !== undefined) s.status = updates.status;
    });
  });
}

export async function linkDetectionToItem(detectionId: string, itemId: string): Promise<void> {
  const detection = await scanDetectionsCollection.find(detectionId);
  await detection.linkToItem(itemId);
}

export async function updateDetectionCloudAi(detectionId: string, result: string): Promise<void> {
  const detection = await scanDetectionsCollection.find(detectionId);
  await detection.updateCloudAiResult(result);
}

// ── Delete ─────────────────────────────────────────────────────────────

export async function deleteScan(scanId: string): Promise<void> {
  const scan = await scansCollection.find(scanId);
  await scan.markAsDeleted();
}

export async function deleteScanDetection(detectionId: string): Promise<void> {
  const detection = await scanDetectionsCollection.find(detectionId);
  await database.write(async () => {
    await detection.markAsDeleted();
  });
}
