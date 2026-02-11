import { Q } from '@nozbe/watermelondb';
import database, { Room, Zone, Item } from '../index';

const roomsCollection = database.get<Room>('rooms');
const zonesCollection = database.get<Zone>('zones');
const itemsCollection = database.get<Item>('items');

/**
 * Observe all rooms sorted by updated_at descending.
 * Returns an observable that emits whenever the rooms table changes.
 */
export function getAllRooms() {
  return roomsCollection
    .query(Q.sortBy('updated_at', Q.desc))
    .observe();
}

/**
 * Find a single room by its ID.
 */
export async function getRoomById(id: string): Promise<Room> {
  return roomsCollection.find(id);
}

/**
 * Create a new room in the database.
 */
export async function createRoom(
  name: string,
  description?: string,
): Promise<Room> {
  return database.write(async () => {
    return roomsCollection.create((room) => {
      room.name = name;
      room.description = description ?? null;
      room.thumbnailUri = null;
      room.thumbnailCloudUrl = null;
      room.roomplanDataUri = null;
      room.has3dScan = false;
      room.itemCount = 0;
    });
  });
}

/**
 * Update an existing room's fields.
 */
export async function updateRoom(
  id: string,
  fields: {
    name?: string;
    description?: string | null;
    thumbnailUri?: string | null;
    thumbnailCloudUrl?: string | null;
    roomplanDataUri?: string | null;
    has3dScan?: boolean;
    itemCount?: number;
  },
): Promise<void> {
  const room = await roomsCollection.find(id);
  await room.updateRoom(fields);
}

/**
 * Mark a room and all its child zones/items as deleted.
 * Uses batch operations for performance.
 */
export async function deleteRoom(id: string): Promise<void> {
  await database.write(async () => {
    const room = await roomsCollection.find(id);

    // Find all child zones and items
    const zones = await zonesCollection
      .query(Q.where('room_id', id))
      .fetch();
    const items = await itemsCollection
      .query(Q.where('room_id', id))
      .fetch();

    const batches = [
      ...zones.map((z) => z.prepareMarkAsDeleted()),
      ...items.map((i) => i.prepareMarkAsDeleted()),
      room.prepareMarkAsDeleted(),
    ];

    await database.batch(...batches);
  });
}
