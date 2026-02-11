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
import type Room from './Room';
import type Item from './Item';

export default class Zone extends Model {
  static table = 'zones';

  static associations: Associations = {
    rooms: { type: 'belongs_to' as const, key: 'room_id' },
    items: { type: 'has_many' as const, foreignKey: 'zone_id' },
  };

  // ── Fields ───────────────────────────────────────────────────────────

  @text('name') name!: string;
  @text('zone_type') zoneType!: string;
  @text('room_id') roomId!: string;
  @text('thumbnail_uri') thumbnailUri!: string | null;
  @text('thumbnail_cloud_url') thumbnailCloudUrl!: string | null;
  @field('layer_count') layerCount!: number;
  @text('description') description!: string | null;
  @field('item_count') itemCount!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  // ── Relations ────────────────────────────────────────────────────────

  @relation('rooms', 'room_id') room!: ReturnType<Model['collections']['get']>;
  @children('items') items!: ReturnType<Model['collections']['get']>;

  // ── Writers ──────────────────────────────────────────────────────────

  @writer async updateZone(fields: {
    name?: string;
    zoneType?: string;
    thumbnailUri?: string | null;
    thumbnailCloudUrl?: string | null;
    layerCount?: number;
    description?: string | null;
    itemCount?: number;
  }) {
    await this.update((zone: Zone) => {
      if (fields.name !== undefined) zone.name = fields.name;
      if (fields.zoneType !== undefined) zone.zoneType = fields.zoneType;
      if (fields.thumbnailUri !== undefined) zone.thumbnailUri = fields.thumbnailUri;
      if (fields.thumbnailCloudUrl !== undefined)
        zone.thumbnailCloudUrl = fields.thumbnailCloudUrl;
      if (fields.layerCount !== undefined) zone.layerCount = fields.layerCount;
      if (fields.description !== undefined) zone.description = fields.description;
      if (fields.itemCount !== undefined) zone.itemCount = fields.itemCount;
    });
  }

  @writer async markAsDeleted() {
    const items: Item[] = await (this.items as any).fetch();
    const allBatches = [
      ...items.map((i: Item) => i.prepareMarkAsDeleted()),
      this.prepareMarkAsDeleted(),
    ];
    await this.batch(...allBatches);
  }
}
