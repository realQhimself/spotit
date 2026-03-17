import { Model } from '@nozbe/watermelondb';
import {
  text,
  field,
  date,
  readonly,
  children,
  writer,
} from '@nozbe/watermelondb/decorators';
import type { Associations } from '@nozbe/watermelondb/Model';
import type Zone from './Zone';
import type Item from './Item';
import type Scan from './Scan';

export default class Room extends Model {
  static table = 'rooms';

  static associations: Associations = {
    zones: { type: 'has_many' as const, foreignKey: 'room_id' },
    items: { type: 'has_many' as const, foreignKey: 'room_id' },
    scans: { type: 'has_many' as const, foreignKey: 'room_id' },
  };

  // ── Fields ───────────────────────────────────────────────────────────

  @text('name') name!: string;
  @text('description') description!: string | null;
  @text('thumbnail_uri') thumbnailUri!: string | null;
  @text('thumbnail_cloud_url') thumbnailCloudUrl!: string | null;
  @text('roomplan_data_uri') roomplanDataUri!: string | null;
  @field('has_3d_scan') has3dScan!: boolean;
  @field('item_count') itemCount!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('last_scanned_at') lastScannedAt!: Date;

  // ── Relations ────────────────────────────────────────────────────────

  @children('zones') zones!: ReturnType<Model['collections']['get']>;
  @children('items') items!: ReturnType<Model['collections']['get']>;
  @children('scans') scans!: ReturnType<Model['collections']['get']>;

  // ── Writers ──────────────────────────────────────────────────────────

  @writer async updateRoom(fields: {
    name?: string;
    description?: string | null;
    thumbnailUri?: string | null;
    thumbnailCloudUrl?: string | null;
    roomplanDataUri?: string | null;
    has3dScan?: boolean;
    itemCount?: number;
  }) {
    await this.update((room: Room) => {
      if (fields.name !== undefined) room.name = fields.name;
      if (fields.description !== undefined) room.description = fields.description;
      if (fields.thumbnailUri !== undefined) room.thumbnailUri = fields.thumbnailUri;
      if (fields.thumbnailCloudUrl !== undefined)
        room.thumbnailCloudUrl = fields.thumbnailCloudUrl;
      if (fields.roomplanDataUri !== undefined)
        room.roomplanDataUri = fields.roomplanDataUri;
      if (fields.has3dScan !== undefined) room.has3dScan = fields.has3dScan;
      if (fields.itemCount !== undefined) room.itemCount = fields.itemCount;
    });
  }

  @writer async markAsDeleted() {
    // Also cascade-delete child zones, items, scans
    const [zones, items, scans] = await Promise.all([
      (this.zones as any).fetch(),
      (this.items as any).fetch(),
      (this.scans as any).fetch(),
    ]);

    const allBatches = [
      ...zones.map((z: Zone) => z.prepareMarkAsDeleted()),
      ...items.map((i: Item) => i.prepareMarkAsDeleted()),
      ...scans.map((s: Scan) => s.prepareMarkAsDeleted()),
      this.prepareMarkAsDeleted(),
    ];

    await this.batch(...allBatches);
  }
}
