/**
 * Database helpers barrel export.
 *
 * Re-exports all helper functions from individual helper modules
 * for convenient importing throughout the application.
 */

// ── Room Helpers ───────────────────────────────────────────────────────
export {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from './roomHelpers';

// ── Zone Helpers ───────────────────────────────────────────────────────
export {
  getZonesByRoom,
  getZoneById,
  createZone,
} from './zoneHelpers';

// ── Item Helpers ───────────────────────────────────────────────────────
export {
  createItem,
  getItemsByRoom,
  getItemsByZone,
  getRecentItems,
  updateItem,
  deleteItem,
  getItemCount,
} from './itemHelpers';

export type { CreateItemData } from './itemHelpers';

// ── Scan Helpers ───────────────────────────────────────────────────────
export {
  createScan,
  createScanDetection,
  getRecentScans,
  getScansByRoom,
  getScanById,
  getDetectionsByScan,
  completeScan,
  failScan,
  updateScan,
  linkDetectionToItem,
  updateDetectionCloudAi,
  deleteScan,
  deleteScanDetection,
  getScanCount,
  getScanCountByRoom,
} from './scanHelpers';

export type { CreateScanDetectionData } from './scanHelpers';

// ── Search Helpers ─────────────────────────────────────────────────────
export {
  searchItems,
  findItemLocation,
} from './searchHelpers';

export type { SearchFilters } from './searchHelpers';
