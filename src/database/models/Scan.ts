import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  relation,
  children,
  writer,
} from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type ScanDetection from './ScanDetection';

export default class Scan extends Model {
  static table = 'scans';

  static associations: Associations = {
    rooms: { type: 'belongs_to' as const, key: 'room_id' },
    scan_detections: { type: 'has_many' as const, foreignKey: 'scan_id' },
  };

  // ── Fields ───────────────────────────────────────────────────────────

  @text('room_id') roomId!: string;
  @text('zone_id') zoneId!: string | null;
  @text('scan_type') scanType!: string;
  @text('photo_uri') photoUri!: string | null;
  @text('photo_cloud_url') photoCloudUrl!: string | null;
  @text('annotated_photo_uri') annotatedPhotoUri!: string | null;
  @field('detection_count') detectionCount!: number;
  @text('status') status!: string;
  @readonly @date('created_at') createdAt!: Date;
  @date('completed_at') completedAt!: Date | null;

  // ── Relations ────────────────────────────────────────────────────────

  @relation('rooms', 'room_id') room!: ReturnType<Model['collections']['get']>;
  @children('scan_detections') detections!: ReturnType<Model['collections']['get']>;

  // ── Writers ──────────────────────────────────────────────────────────

  @writer async completeScan(detectionCount: number) {
    await this.update((scan: Scan) => {
      scan.status = 'completed';
      scan.detectionCount = detectionCount;
      scan.completedAt = new Date() as any;
    });
  }

  @writer async failScan() {
    await this.update((scan: Scan) => {
      scan.status = 'failed';
      scan.completedAt = new Date() as any;
    });
  }

  @writer async markAsDeleted() {
    const detections: ScanDetection[] = await (this.detections as any).fetch();
    const allBatches = [
      ...detections.map((d: ScanDetection) => d.prepareMarkAsDeleted()),
      this.prepareMarkAsDeleted(),
    ];
    await this.batch(...allBatches);
  }
}
