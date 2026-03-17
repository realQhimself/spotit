import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RoomsStackParamList } from '../../types/navigation';
import type Room from '../../database/models/Room';
import type Zone from '../../database/models/Zone';
import type Item from '../../database/models/Item';
import { getRoomById } from '../../database/helpers/roomHelpers';
import { getZonesByRoom } from '../../database/helpers/zoneHelpers';
import { getItemsByRoom } from '../../database/helpers/itemHelpers';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { showAlert } from '../../utils/alert';

type Props = StackScreenProps<RoomsStackParamList, 'RoomDetail'>;

const ZONE_ICONS: Record<string, string> = {
  fridge: '\u{1F9CA}',
  cabinet: '\u{1F5C4}',
  surface: '\u{1F6CB}',
  drawer: '\u{1F4E6}',
  closet: '\u{1F6AA}',
  default: '\u{1F4E6}',
};

function relativeTime(date: Date | null | undefined): string {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return colors.success;
  if (confidence >= 0.7) return colors.warning;
  return colors.danger;
}

function ZoneCard({
  zone,
  onPress,
}: {
  zone: Zone;
  onPress: () => void;
}) {
  const icon = ZONE_ICONS[zone.zoneType] || ZONE_ICONS.default;

  return (
    <TouchableOpacity style={styles.zoneCard} activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.zoneIcon}>{icon}</Text>
      <Text style={styles.zoneName} numberOfLines={1}>
        {zone.name}
      </Text>
      <Text style={styles.zoneCount}>
        {zone.itemCount} {zone.itemCount === 1 ? 'item' : 'items'}
      </Text>
    </TouchableOpacity>
  );
}

function ItemCard({
  item,
  onPress,
}: {
  item: Item;
  onPress: () => void;
}) {
  const confPercent = Math.round(item.confidence * 100);
  const confColor = getConfidenceColor(item.confidence);

  return (
    <TouchableOpacity style={styles.itemRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.itemThumb}>
        <Text style={styles.itemThumbText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.itemMetaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          <View style={styles.confidenceContainer}>
            <View style={styles.confidenceBarBg}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${confPercent}%`, backgroundColor: confColor },
                ]}
              />
            </View>
            <Text style={[styles.confidenceText, { color: confColor }]}>
              {confPercent}%
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.itemLastSeen}>{relativeTime(item.lastSeenAt)}</Text>
    </TouchableOpacity>
  );
}

export default function RoomDetailScreen({ route, navigation }: Props) {
  const { roomId } = route.params;

  const [room, setRoom] = useState<Room | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    getRoomById(roomId)
      .then(setRoom)
      .catch((err) => console.error('Failed to load room:', err));
  }, [roomId]);

  useEffect(() => {
    const zoneSub = getZonesByRoom(roomId).subscribe(setZones);
    const itemSub = getItemsByRoom(roomId).subscribe(setItems);
    return () => {
      zoneSub.unsubscribe();
      itemSub.unsubscribe();
    };
  }, [roomId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Header Image Placeholder */}
        <View style={styles.heroImage}>
          <Text style={styles.heroEmoji}>{'\u{1F3E0}'}</Text>
          <Text style={styles.heroRoomName}>{room?.name ?? 'Loading...'}</Text>
          <Text style={styles.heroRoomId}>ID: {roomId}</Text>
        </View>

        {/* Zones Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zones</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zonesScroll}
          >
            {zones.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                onPress={() =>
                  navigation.navigate('ZoneDetail', { zoneId: zone.id })
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* All Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Items</Text>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items found in this room</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <ItemCard
                  item={item}
                  onPress={() =>
                    navigation.navigate('ItemDetail', { itemId: item.id })
                  }
                />
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* FAB to scan this room */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Scan',
            params: { screen: 'CameraScan', params: { mode: 'room' } },
          })
        );
      }}>
        <Text style={styles.fabText}>{'\u{1F4F7}'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    height: 180,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  heroRoomName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  heroRoomId: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  zonesScroll: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  zoneCard: {
    width: 130,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  zoneIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  zoneName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  zoneCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  itemThumbText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceBarBg: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  confidenceBarFill: {
    height: 4,
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
  },
  itemLastSeen: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 24,
  },
});
