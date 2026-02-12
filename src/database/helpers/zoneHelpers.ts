import { Q } from '@nozbe/watermelondb';
import database, { Zone } from '../index';

const zonesCollection = database.get<Zone>('zones');

export function getZonesByRoom(roomId: string) {
  return zonesCollection
    .query(Q.where('room_id', roomId), Q.sortBy('name', Q.asc))
    .observe();
}

export async function getZoneById(id: string): Promise<Zone> {
  return zonesCollection.find(id);
}

export async function createZone(
  name: string,
  zoneType: string,
  roomId: string,
  layerCount: number = 1,
  description?: string,
): Promise<Zone> {
  return database.write(async () => {
    return zonesCollection.create((zone) => {
      zone.name = name;
      zone.zoneType = zoneType;
      zone.roomId = roomId;
      zone.layerCount = layerCount;
      zone.description = description ?? null;
      zone.thumbnailUri = null;
      zone.thumbnailCloudUrl = null;
      zone.itemCount = 0;
    });
  });
}
