import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RoomsStackParamList } from '../../types/navigation';
import type Room from '../../database/models/Room';
import { getAllRooms } from '../../database/helpers/roomHelpers';
import { createRoom } from '../../database/helpers/roomHelpers';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<RoomsStackParamList, 'RoomList'>;

const ROOM_COLORS = [
  '#818CF8',
  '#34D399',
  '#F59E0B',
  '#F87171',
  '#60A5FA',
  '#A78BFA',
];

function RoomCard({
  room,
  index,
  onPress,
}: {
  room: Room;
  index: number;
  onPress: () => void;
}) {
  const bgColor = ROOM_COLORS[index % ROOM_COLORS.length];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.cardThumbnail, { backgroundColor: bgColor }]}>
        <Text style={styles.cardThumbnailText}>
          {room.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {room.name}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {room.itemCount} {room.itemCount === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoomListScreen({ navigation }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const sub = getAllRooms().subscribe(setRooms);
    return () => sub.unsubscribe();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Observable auto-updates; brief visual feedback
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleAddRoom = useCallback(() => {
    Alert.prompt(
      'New Room',
      'Enter a name for the room:',
      async (name) => {
        const trimmed = name?.trim();
        if (!trimmed) return;
        try {
          await createRoom(trimmed);
        } catch (err) {
          console.error('Failed to create room:', err);
          Alert.alert('Error', 'Could not create the room. Please try again.');
        }
      },
      'plain-text',
      '',
      'default',
    );
  }, []);

  const renderItem = ({ item, index }: { item: Room; index: number }) => (
    <RoomCard
      room={item}
      index={index}
      onPress={() => navigation.navigate('RoomDetail', { roomId: item.id })}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {rooms.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'\u{1F6AA}'}</Text>
          <Text style={styles.emptyTitle}>No rooms yet</Text>
          <Text style={styles.emptyText}>
            Tap + to add your first room.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleAddRoom}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardThumbnail: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardThumbnailText: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  cardBody: {
    padding: spacing.sm,
  },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
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
  fabIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: fontWeight.regular,
    lineHeight: 30,
  },
});
