/**
 * Item CRUD helper functions using WatermelonDB.
 */

import { Q } from '@nozbe/watermelondb';
import database, { Item } from '../index';

const itemsCollection = database.get<Item>('items');

// ── Types ──────────────────────────────────────────────────────────────

export interface CreateItemData {
  name: string;
  category: string;
  roomId: string;
  subcategory?: string;
  description?: string;
  zoneId?: string;
  layer?: number;
  positionDescription?: string;
  tags?: string[];
  aiLabels?: string[];
  confidence?: number;
  yoloClass?: string;
  cloudAiEnriched?: string;
  thumbnailUri?: string;
  isFavorite?: boolean;
}

// ── Create ─────────────────────────────────────────────────────────────

/**
 * Create a new item in the database.
 *
 * @param data - Item fields. `name`, `category`, and `roomId` are required.
 * @returns The newly created Item model instance.
 */
export async function createItem(data: CreateItemData): Promise<Item> {
  return database.write(async () => {
    return itemsCollection.create((item) => {
      item.name = data.name;
      item.category = data.category;
      item.roomId = data.roomId;
      item.subcategory = data.subcategory ?? null;
      item.description = data.description ?? null;
      item.zoneId = data.zoneId ?? null;
      item.layer = data.layer ?? 0;
      item.positionDescription = data.positionDescription ?? null;
      item.tags = data.tags ? JSON.stringify(data.tags) : null;
      item.aiLabels = data.aiLabels ? JSON.stringify(data.aiLabels) : null;
      item.confidence = data.confidence ?? 0;
      item.yoloClass = data.yoloClass ?? null;
      item.cloudAiEnriched = data.cloudAiEnriched ?? 'false';
      item.thumbnailUri = data.thumbnailUri ?? null;
      item.thumbnailCloudUrl = null;
      item.isFavorite = data.isFavorite ?? false;
    });
  });
}

// ── Read ───────────────────────────────────────────────────────────────

/**
 * Observe items belonging to a specific room, ordered by last seen descending.
 * Returns an observable that re-emits whenever the underlying data changes.
 */
export function getItemsByRoom(roomId: string) {
  return itemsCollection
    .query(
      Q.where('room_id', roomId),
      Q.sortBy('last_seen_at', Q.desc),
    )
    .observe();
}

/**
 * Observe items belonging to a specific zone, ordered by layer then name.
 * Returns an observable that re-emits whenever the underlying data changes.
 */
export function getItemsByZone(zoneId: string) {
  return itemsCollection
    .query(
      Q.where('zone_id', zoneId),
      Q.sortBy('layer', Q.asc),
      Q.sortBy('name', Q.asc),
    )
    .observe();
}

/**
 * Observe the most recently created items across all rooms.
 *
 * @param limit - Maximum number of items to return (default 20).
 */
export function getRecentItems(limit: number = 20) {
  return itemsCollection
    .query(
      Q.sortBy('created_at', Q.desc),
      Q.take(limit),
    )
    .observe();
}

// ── Update ─────────────────────────────────────────────────────────────

/**
 * Update an existing item's fields.
 *
 * @param id - WatermelonDB record ID of the item.
 * @param fields - Object containing the fields to update.
 */
export async function updateItem(
  id: string,
  fields: {
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
  },
): Promise<void> {
  const item = await itemsCollection.find(id);
  await item.updateItem(fields);
}

// ── Delete ─────────────────────────────────────────────────────────────

/**
 * Delete an item and its associated photos.
 *
 * Uses the cascade delete defined in the Item model's `markAsDeleted` writer.
 *
 * @param id - WatermelonDB record ID of the item to delete.
 */
export async function deleteItem(id: string): Promise<void> {
  const item = await itemsCollection.find(id);
  await item.markAsDeleted();
}

// ── Count ──────────────────────────────────────────────────────────────

/**
 * Get the total count of all items in the database.
 */
export async function getItemCount(): Promise<number> {
  return itemsCollection.query().fetchCount();
}
