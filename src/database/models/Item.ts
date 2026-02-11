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
import type ItemPhoto from './ItemPhoto';

export default class Item extends Model {
  static table = 'items';

  static associations: Associations = {
    rooms: { type: 'belongs_to' as const, key: 'room_id' },
    zones: { type: 'belongs_to' as const, key: 'zone_id' },
    item_photos: { type: 'has_many' as const, foreignKey: 'item_id' },
  };

  // ── Fields ───────────────────────────────────────────────────────────

  @text('name') name!: string;
  @text('category') category!: string;
  @text('subcategory') subcategory!: string | null;
  @text('description') description!: string | null;
  @text('room_id') roomId!: string;
  @text('zone_id') zoneId!: string | null;
  @field('layer') layer!: number;
  @text('position_description') positionDescription!: string | null;
  @text('tags') tags!: string | null;
  @text('ai_labels') aiLabels!: string | null;
  @field('confidence') confidence!: number;
  @text('yolo_class') yoloClass!: string | null;
  @text('cloud_ai_enriched') cloudAiEnriched!: string;
  @text('thumbnail_uri') thumbnailUri!: string | null;
  @text('thumbnail_cloud_url') thumbnailCloudUrl!: string | null;
  @field('is_favorite') isFavorite!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
  @date('last_seen_at') lastSeenAt!: Date;

  // ── Relations ────────────────────────────────────────────────────────

  @relation('rooms', 'room_id') room!: ReturnType<Model['collections']['get']>;
  @relation('zones', 'zone_id') zone!: ReturnType<Model['collections']['get']>;
  @children('item_photos') photos!: ReturnType<Model['collections']['get']>;

  // ── Convenience ──────────────────────────────────────────────────────

  /** Parse the JSON-encoded tags string into an array */
  get tagsArray(): string[] {
    if (!this.tags) return [];
    try {
      return JSON.parse(this.tags);
    } catch {
      // Fallback: comma-separated
      return this.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
  }

  /** Parse the JSON-encoded ai_labels string into an array */
  get aiLabelsArray(): string[] {
    if (!this.aiLabels) return [];
    try {
      return JSON.parse(this.aiLabels);
    } catch {
      return this.aiLabels.split(',').map((l) => l.trim()).filter(Boolean);
    }
  }

  // ── Writers ──────────────────────────────────────────────────────────

  @writer async updateItem(fields: {
    name?: string;
    category?: string;
    subcategory?: string | null;
    description?: string | null;
    roomId?: string;
    zoneId?: string | null;
    layer?: number;
    positionDescription?: string | null;
    tags?: string | null;
    aiLabels?: string | null;
    confidence?: number;
    yoloClass?: string | null;
    cloudAiEnriched?: string;
    thumbnailUri?: string | null;
    thumbnailCloudUrl?: string | null;
    isFavorite?: boolean;
  }) {
    await this.update((item: Item) => {
      if (fields.name !== undefined) item.name = fields.name;
      if (fields.category !== undefined) item.category = fields.category;
      if (fields.subcategory !== undefined) item.subcategory = fields.subcategory;
      if (fields.description !== undefined) item.description = fields.description;
      if (fields.roomId !== undefined) item.roomId = fields.roomId;
      if (fields.zoneId !== undefined) item.zoneId = fields.zoneId;
      if (fields.layer !== undefined) item.layer = fields.layer;
      if (fields.positionDescription !== undefined)
        item.positionDescription = fields.positionDescription;
      if (fields.tags !== undefined) item.tags = fields.tags;
      if (fields.aiLabels !== undefined) item.aiLabels = fields.aiLabels;
      if (fields.confidence !== undefined) item.confidence = fields.confidence;
      if (fields.yoloClass !== undefined) item.yoloClass = fields.yoloClass;
      if (fields.cloudAiEnriched !== undefined)
        item.cloudAiEnriched = fields.cloudAiEnriched;
      if (fields.thumbnailUri !== undefined) item.thumbnailUri = fields.thumbnailUri;
      if (fields.thumbnailCloudUrl !== undefined)
        item.thumbnailCloudUrl = fields.thumbnailCloudUrl;
      if (fields.isFavorite !== undefined) item.isFavorite = fields.isFavorite;
    });
  }

  @writer async toggleFavorite() {
    await this.update((item: Item) => {
      item.isFavorite = !item.isFavorite;
    });
  }

  @writer async markAsDeleted() {
    const photos: ItemPhoto[] = await (this.photos as any).fetch();
    const allBatches = [
      ...photos.map((p: ItemPhoto) => p.prepareMarkAsDeleted()),
      this.prepareMarkAsDeleted(),
    ];
    await this.batch(...allBatches);
  }
}
