/**
 * Search helpers for finding items across the WatermelonDB database.
 *
 * Provides full-text-like searching using WatermelonDB's Q.like operator
 * and a natural-language "Where is my ...?" handler.
 */

import { Q } from '@nozbe/watermelondb';
import database, { Item, Room, Zone } from '../index';
import type { SearchResult, MatchType } from '../../types/detection';

const itemsCollection = database.get<Item>('items');
const roomsCollection = database.get<Room>('rooms');
const zonesCollection = database.get<Zone>('zones');

// ── Types ──────────────────────────────────────────────────────────────

export interface SearchFilters {
  category?: string;
  roomId?: string;
  isFavorite?: boolean;
}

// ── Internal helpers ───────────────────────────────────────────────────

/**
 * Wrap a search term with wildcards for SQL LIKE matching.
 * WatermelonDB uses `%` for multi-char wildcard.
 */
function likePattern(term: string): string {
  const sanitized = Q.sanitizeLikeString(term);
  return `%${sanitized}%`;
}

/**
 * Determine which field produced the best match for a given item.
 */
function detectMatchType(item: Item, query: string): MatchType {
  const q = query.toLowerCase();
  if (item.name.toLowerCase().includes(q)) return 'name';
  if (item.category.toLowerCase().includes(q)) return 'category';
  if (item.tags?.toLowerCase().includes(q)) return 'tag';
  if (item.description?.toLowerCase().includes(q)) return 'description';
  return 'name';
}

/**
 * Relevance scoring based on which fields match.
 *
 * Weights:
 *   - name match:        100
 *   - category match:     80
 *   - tag match:          60
 *   - description match:  40
 *
 * Bonuses: favourite items get +5.
 */
function scoreItem(item: Item, query: string): number {
  const q = query.toLowerCase();
  let score = 0;

  if (item.name?.toLowerCase().includes(q)) score += 100;
  if (item.category?.toLowerCase().includes(q)) score += 80;
  if (item.tags?.toLowerCase().includes(q)) score += 60;
  if (item.description?.toLowerCase().includes(q)) score += 40;
  if (item.aiLabels?.toLowerCase().includes(q)) score += 10;

  // Boost favourites slightly
  if (item.isFavorite) score += 5;

  return score;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Search items across name, category, tags, and description fields.
 *
 * Results are ranked by a relevance score and optionally filtered
 * by category, room, or favourite status.
 *
 * @param query   - Free-text search query.
 * @param filters - Optional filters to narrow the result set.
 * @returns Array of SearchResult objects sorted by relevance score descending.
 */
export async function searchItems(
  query: string,
  filters?: SearchFilters,
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = likePattern(trimmed);

  // Build the OR clause across searchable text fields
  const textMatch = Q.or(
    Q.where('name', Q.like(pattern)),
    Q.where('category', Q.like(pattern)),
    Q.where('tags', Q.like(pattern)),
    Q.where('description', Q.like(pattern)),
    Q.where('ai_labels', Q.like(pattern)),
  );

  // Build optional AND filters
  const andClauses: Q.Clause[] = [textMatch];

  if (filters?.category) {
    andClauses.push(Q.where('category', filters.category));
  }
  if (filters?.roomId) {
    andClauses.push(Q.where('room_id', filters.roomId));
  }
  if (filters?.isFavorite !== undefined) {
    andClauses.push(Q.where('is_favorite', filters.isFavorite));
  }

  const items = await itemsCollection
    .query(Q.and(...andClauses))
    .fetch();

  // Resolve room names for the result set
  const uniqueRoomIds = [...new Set(items.map((i) => i.roomId))];
  const roomMap = new Map<string, string>();

  await Promise.all(
    uniqueRoomIds.map(async (id) => {
      try {
        const room = await roomsCollection.find(id);
        roomMap.set(id, room.name);
      } catch {
        roomMap.set(id, 'Unknown Room');
      }
    }),
  );

  // Map to SearchResult, score, and sort
  const results: SearchResult[] = items.map((item) => ({
    itemId: item.id,
    name: item.name,
    category: item.category,
    roomName: roomMap.get(item.roomId) ?? 'Unknown Room',
    thumbnailUri: item.thumbnailUri ?? undefined,
    relevanceScore: scoreItem(item, trimmed),
    matchType: detectMatchType(item, trimmed),
  }));

  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results;
}

/**
 * Natural-language "Where is my ...?" handler.
 *
 * Strips common question prefixes ("where is my", "where's my", "find my",
 * "where did I put", etc.), searches for the item, and returns a formatted
 * location string like "Laptop Charger is in: Living Room > Desk > Layer 2".
 *
 * @param query - Natural language query, e.g. "Where is my laptop charger?"
 * @returns A human-readable location string, or a not-found message.
 */
export async function findItemLocation(query: string): Promise<string> {
  // Strip common prefixes to extract the item name
  const itemName = query
    .replace(
      /^(where\s+(is|are|did\s+i\s+(put|leave))\s+(my\s+|the\s+)?|find\s+(my\s+|the\s+)?|locate\s+(my\s+|the\s+)?)/i,
      '',
    )
    .replace(/[?!.]+$/, '')
    .trim();

  if (!itemName) return 'Please specify what you are looking for.';

  const results = await searchItems(itemName);

  if (results.length === 0) {
    return `Could not find "${itemName}" in your inventory.`;
  }

  // Use the highest-scoring result
  const best = results[0];
  const parts: string[] = [best.roomName];

  // Enrich with zone and layer info from the actual item record
  try {
    const item = await itemsCollection.find(best.itemId);
    if (item.zoneId) {
      try {
        const zone = await zonesCollection.find(item.zoneId);
        parts.push(zone.name);
      } catch {
        // Zone not found; skip
      }
    }
    if (item.layer > 0) {
      parts.push(`Layer ${item.layer}`);
    }
  } catch {
    // Item lookup failed; use what we have
  }

  return `${best.name} is in: ${parts.join(' > ')}`;
}
