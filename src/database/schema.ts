import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // ── Rooms ──────────────────────────────────────────────────────────
    tableSchema({
      name: 'rooms',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'thumbnail_uri', type: 'string', isOptional: true },
        { name: 'thumbnail_cloud_url', type: 'string', isOptional: true },
        { name: 'roomplan_data_uri', type: 'string', isOptional: true },
        { name: 'has_3d_scan', type: 'boolean' },
        { name: 'item_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_scanned_at', type: 'number' },
      ],
    }),

    // ── Zones ──────────────────────────────────────────────────────────
    tableSchema({
      name: 'zones',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'zone_type', type: 'string' },
        { name: 'room_id', type: 'string', isIndexed: true },
        { name: 'thumbnail_uri', type: 'string', isOptional: true },
        { name: 'thumbnail_cloud_url', type: 'string', isOptional: true },
        { name: 'layer_count', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'item_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ── Items ──────────────────────────────────────────────────────────
    tableSchema({
      name: 'items',
      columns: [
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'category', type: 'string', isIndexed: true },
        { name: 'subcategory', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'room_id', type: 'string', isIndexed: true },
        { name: 'zone_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'layer', type: 'number' },
        { name: 'position_description', type: 'string', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true },
        { name: 'ai_labels', type: 'string', isOptional: true },
        { name: 'confidence', type: 'number' },
        { name: 'yolo_class', type: 'string', isOptional: true },
        { name: 'cloud_ai_enriched', type: 'string' },
        { name: 'thumbnail_uri', type: 'string', isOptional: true },
        { name: 'thumbnail_cloud_url', type: 'string', isOptional: true },
        { name: 'is_favorite', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_seen_at', type: 'number' },
      ],
    }),

    // ── Item Photos ────────────────────────────────────────────────────
    tableSchema({
      name: 'item_photos',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'local_uri', type: 'string' },
        { name: 'cloud_url', type: 'string', isOptional: true },
        { name: 'width', type: 'number' },
        { name: 'height', type: 'number' },
        { name: 'upload_status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ── Scans ──────────────────────────────────────────────────────────
    tableSchema({
      name: 'scans',
      columns: [
        { name: 'room_id', type: 'string', isIndexed: true },
        { name: 'zone_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'scan_type', type: 'string' },
        { name: 'photo_uri', type: 'string', isOptional: true },
        { name: 'photo_cloud_url', type: 'string', isOptional: true },
        { name: 'annotated_photo_uri', type: 'string', isOptional: true },
        { name: 'detection_count', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'completed_at', type: 'number', isOptional: true },
      ],
    }),

    // ── Scan Detections ────────────────────────────────────────────────
    tableSchema({
      name: 'scan_detections',
      columns: [
        { name: 'scan_id', type: 'string', isIndexed: true },
        { name: 'item_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'yolo_class', type: 'string' },
        { name: 'confidence', type: 'number' },
        { name: 'bbox', type: 'string' },
        { name: 'cloud_ai_result', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
