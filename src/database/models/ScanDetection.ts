import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  relation,
  writer,
} from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';

export default class ScanDetection extends Model {
  static table = 'scan_detections';

  static associations: Associations = {
    scans: { type: 'belongs_to' as const, key: 'scan_id' },
    items: { type: 'belongs_to' as const, key: 'item_id' },
  };

  // ── Fields ───────────────────────────────────────────────────────────

  @text('scan_id') scanId!: string;
  @text('item_id') itemId!: string | null;
  @field('confidence') confidence!: number;
  @text('yolo_class') yoloClass!: string;
  @text('bbox') bbox!: string;
  @text('cloud_ai_result') cloudAiResult!: string | null;
  @text('status') status!: string;
  @readonly @date('created_at') createdAt!: Date;

  // ── Relations ────────────────────────────────────────────────────────

  @relation('scans', 'scan_id') scan!: ReturnType<Model['collections']['get']>;
  @relation('items', 'item_id') item!: ReturnType<Model['collections']['get']>;

  // ── Convenience ──────────────────────────────────────────────────────

  /** Parse the JSON-encoded bbox into [x, y, width, height] */
  get bboxArray(): [number, number, number, number] {
    try {
      return JSON.parse(this.bbox);
    } catch {
      return [0, 0, 0, 0];
    }
  }

  // ── Writers ──────────────────────────────────────────────────────────

  @writer async linkToItem(itemId: string) {
    await this.update((detection: ScanDetection) => {
      detection.itemId = itemId;
      detection.status = 'matched';
    });
  }

  @writer async updateCloudAiResult(result: string) {
    await this.update((detection: ScanDetection) => {
      detection.cloudAiResult = result;
      detection.status = 'enriched';
    });
  }
}
