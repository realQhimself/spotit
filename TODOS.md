# SpotIt — Deferred Work

## Phase 3 — Production Hardening

### P2: Switch native DB adapter to SQLite
- database/index.ts: detect platform, use SQLiteAdapter on iOS/Android, keep LokiJS on web
- Need to test data migration from LokiJS to SQLite
- Effort: M (4-6h)

### P3: ONNX model CDN integrity check
- useObjectDetection.web.ts: verify model hash after download from CDN
- Prevents man-in-the-middle model substitution
- Effort: S (1-2h)

### P3: WatermelonDB migration system
- database/schema.ts: implement schema migrations for version updates
- Required before any schema changes in production
- Effort: M (4-6h)

### P3: Detection results grouped by category
- ScanReviewScreen: group items by enriched category (Electronics, Kitchen, etc.)
- Depends on: enrichment pipeline being stable
- Effort: S (1-2h)
