import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { HomeStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { showAlert } from '../../utils/alert';
import database from '../../database';
import type Room from '../../database/models/Room';
import type Item from '../../database/models/Item';
import { getAllRooms, createRoom } from '../../database/helpers/roomHelpers';
import { getRecentItems, getItemCount } from '../../database/helpers/itemHelpers';

type Props = StackScreenProps<HomeStackParamList, 'HomeScreen'>;

// -- Color palette for room cards (cycled by position) -----------------------

const ROOM_COLORS = [
  '#EEF2FF',
  '#ECFDF5',
  '#FEF3C7',
  '#FEE2E2',
  '#E0E7FF',
  '#FCE7F3',
  '#F0FDF4',
  '#FFF7ED',
];

// -- Relative-time helper ----------------------------------------------------

function timeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function HomeScreen({ navigation }: Props) {
  // ── Live state from WatermelonDB ────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleAddRoom = useCallback(() => {
    setNewRoomName('');
    setShowAddRoomModal(true);
  }, []);

  const handleConfirmAddRoom = useCallback(async () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;
    setShowAddRoomModal(false);
    setNewRoomName('');
    try {
      await createRoom(trimmed);
    } catch (err) {
      console.error('Failed to create room:', err);
      showAlert('Error', 'Could not create the room. Please try again.');
    }
  }, [newRoomName]);

  // Subscribe to rooms observable
  useEffect(() => {
    const sub = getAllRooms().subscribe(setRooms);
    return () => sub.unsubscribe();
  }, []);

  // Subscribe to recent items observable
  useEffect(() => {
    const sub = getRecentItems(5).subscribe(setRecentItems);
    return () => sub.unsubscribe();
  }, []);

  // Fetch item count (re-fetch whenever recentItems changes as a proxy for data changes)
  useEffect(() => {
    let cancelled = false;
    getItemCount().then((count) => {
      if (!cancelled) setItemCount(count);
    });
    return () => { cancelled = true; };
  }, [recentItems]);

  // Fetch scan count (re-fetch whenever rooms change as a proxy for data changes)
  useEffect(() => {
    let cancelled = false;
    database
      .get('scans')
      .query()
      .fetchCount()
      .then((count) => {
        if (!cancelled) setScanCount(count);
      });
    return () => { cancelled = true; };
  }, [rooms]);

  // Build stats from live data
  const stats = [
    { label: 'Items', count: itemCount, icon: '\u{1F4E6}', color: colors.primary },
    { label: 'Rooms', count: rooms.length, icon: '\u{1F6AA}', color: colors.success },
    { label: 'Scans', count: scanCount, icon: '\u{1F4F7}', color: colors.warning },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SpotIt</Text>
          <Text style={styles.subtitle}>Find anything, anywhere</Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SearchResults', { query: '' })}
        >
          <Text style={styles.searchIcon}>{'\u{1F50D}'}</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Where is my...?"
            placeholderTextColor={colors.textTertiary}
            editable={false}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: stat.color + '15' }]}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Items</Text>
          <TouchableOpacity onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Search' }))}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recentItems}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.scanCard}>
              <View style={styles.scanInfo}>
                <Text style={styles.scanMeta}>No items yet. Start scanning!</Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.scanCard} activeOpacity={0.7}>
              <View style={styles.scanThumbnail}>
                <Text style={styles.scanThumbnailText}>{'\u{1F4E6}'}</Text>
              </View>
              <View style={styles.scanInfo}>
                <Text style={styles.scanName}>{item.name}</Text>
                <Text style={styles.scanMeta}>
                  {item.category} {'\u00B7'} {timeAgo(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.chevron}>{'\u203A'}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Your Rooms */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Rooms</Text>
          <TouchableOpacity onPress={() => navigation.dispatch(CommonActions.navigate({ name: 'Rooms' }))}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomsScroll}
        >
          {rooms.length === 0 ? (
            <TouchableOpacity
              style={[styles.roomCard, { backgroundColor: ROOM_COLORS[0] }]}
              activeOpacity={0.7}
              onPress={handleAddRoom}
            >
              <View style={styles.roomIcon}>
                <Text style={{ fontSize: 28 }}>{'\u2795'}</Text>
              </View>
              <Text style={styles.roomName}>Add a Room</Text>
              <Text style={styles.roomItemCount}>Get started</Text>
            </TouchableOpacity>
          ) : (
            rooms.map((room, index) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomCard,
                  { backgroundColor: ROOM_COLORS[index % ROOM_COLORS.length] },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.roomIcon}>
                  <Text style={{ fontSize: 28 }}>{'\u{1F3E0}'}</Text>
                </View>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomItemCount}>{room.itemCount} items</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Add Room Modal */}
      {showAddRoomModal && <Modal visible transparent animationType="fade" onRequestClose={() => setShowAddRoomModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Room</Text>
            <Text style={styles.modalSubtitle}>Enter a name for the room:</Text>
            <TextInput
              style={styles.modalInput}
              value={newRoomName}
              onChangeText={setNewRoomName}
              placeholder="e.g. Living Room"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              onSubmitEditing={handleConfirmAddRoom}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowAddRoomModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, !newRoomName.trim() && styles.modalButtonDisabled]}
                onPress={handleConfirmAddRoom}
                activeOpacity={0.7}
                disabled={!newRoomName.trim()}
              >
                <Text style={styles.modalConfirmText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
    padding: 0,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statIcon: {
    fontSize: 20,
  },
  statCount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  // Recent Scans
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 4,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  scanThumbnail: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanThumbnailText: {
    fontSize: 20,
  },
  scanInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  scanName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  scanMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
    paddingHorizontal: spacing.sm,
  },
  // Rooms horizontal
  roomsScroll: {
    paddingBottom: spacing.sm,
  },
  roomCard: {
    width: 140,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginRight: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  roomIcon: {
    marginBottom: spacing.sm,
  },
  roomName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  roomItemCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalCancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  modalCancelText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  modalConfirmButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
});
