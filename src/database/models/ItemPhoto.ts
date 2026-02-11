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

export default class ItemPhoto extends Model {
  static table = 'item_photos';

  static associations: Associations = {
    items: { type: 'belongs_to' as const, key: 'item_id' },
  };

  // ── Fields ───────────────────────────────────────────────────────────

  @text('item_id') itemId!: string;
  @text('local_uri') localUri!: string;
  @text('cloud_url') cloudUrl!: string | null;
  @field('width') width!: number;
  @field('height') height!: number;
  @text('upload_status') uploadStatus!: string;
  @readonly @date('created_at') createdAt!: Date;

  // ── Relations ────────────────────────────────────────────────────────

  @relation('items', 'item_id') item!: ReturnType<Model['collections']['get']>;

  // ── Writers ──────────────────────────────────────────────────────────

  @writer async updateUploadStatus(status: string, cloudUrl?: string) {
    await this.update((photo: ItemPhoto) => {
      photo.uploadStatus = status;
      if (cloudUrl !== undefined) photo.cloudUrl = cloudUrl;
    });
  }
}
