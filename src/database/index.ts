import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
// Swap the import below for production builds on native:
// import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';

// ── Models ─────────────────────────────────────────────────────────────
import Room from './models/Room';
import Zone from './models/Zone';
import Item from './models/Item';
import ItemPhoto from './models/ItemPhoto';
import Scan from './models/Scan';
import ScanDetection from './models/ScanDetection';

// ── Model classes registry ─────────────────────────────────────────────
const modelClasses = [Room, Zone, Item, ItemPhoto, Scan, ScanDetection];

// ── Adapter ────────────────────────────────────────────────────────────
// LokiJSAdapter works in-memory and is suitable for development / web.
// For production on iOS/Android, switch to SQLiteAdapter:
//
//   const adapter = new SQLiteAdapter({
//     schema,
//     // migrations,          // add when you have migrations
//     jsi: true,              // enable JSI for faster performance on React Native
//     onSetUpError: (error) => {
//       console.error('SQLiteAdapter setup error:', error);
//     },
//   });

const adapter = new LokiJSAdapter({
  schema,
  // migrations,              // add when you have migrations
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onQuotaExceededError: (_error: unknown) => {
    // Handle storage quota exceeded — e.g. notify the user
    console.warn('WatermelonDB: storage quota exceeded');
  },
  onSetUpError: (error: unknown) => {
    console.error('LokiJSAdapter setup error:', error);
  },
});

// ── Database instance ──────────────────────────────────────────────────
const database = new Database({
  adapter,
  modelClasses,
});

export default database;

// Re-export models for convenient access
export { Room, Zone, Item, ItemPhoto, Scan, ScanDetection };
