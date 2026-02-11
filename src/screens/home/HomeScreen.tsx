import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { HomeStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<HomeStackParamList, 'HomeScreen'>;

// -- Placeholder data --------------------------------------------------------

const STATS = [
  { label: 'Items', count: 0, icon: '\u{1F4E6}', color: colors.primary },
  { label: 'Rooms', count: 0, icon: '\u{1F6AA}', color: colors.success },
  { label: 'Scans', count: 0, icon: '\u{1F4F7}', color: colors.warning },
];

const RECENT_SCANS = [
  { id: '1', name: 'Kitchen counter', itemCount: 8, date: '2 hours ago' },
  { id: '2', name: 'Living room shelf', itemCount: 12, date: 'Yesterday' },
  { id: '3', name: 'Office desk', itemCount: 5, date: '3 days ago' },
];

const ROOMS = [
  { id: '1', name: 'Kitchen', itemCount: 24, color: '#EEF2FF' },
  { id: '2', name: 'Living Room', itemCount: 18, color: '#ECFDF5' },
  { id: '3', name: 'Bedroom', itemCount: 12, color: '#FEF3C7' },
  { id: '4', name: 'Office', itemCount: 31, color: '#FEE2E2' },
  { id: '5', name: 'Garage', itemCount: 9, color: '#E0E7FF' },
];

export default function HomeScreen({ navigation }: Props) {
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
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: stat.color + '15' }]}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={styles.statCount}>{stat.count}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Scans */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={RECENT_SCANS}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.scanCard} activeOpacity={0.7}>
              <View style={styles.scanThumbnail}>
                <Text style={styles.scanThumbnailText}>{'\u{1F4F7}'}</Text>
              </View>
              <View style={styles.scanInfo}>
                <Text style={styles.scanName}>{item.name}</Text>
                <Text style={styles.scanMeta}>
                  {item.itemCount} items {'\u00B7'} {item.date}
                </Text>
              </View>
              <Text style={styles.chevron}>{'\u203A'}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Your Rooms */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Rooms</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomsScroll}
        >
          {ROOMS.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[styles.roomCard, { backgroundColor: room.color }]}
              activeOpacity={0.7}
            >
              <View style={styles.roomIcon}>
                <Text style={{ fontSize: 28 }}>{'\u{1F3E0}'}</Text>
              </View>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomItemCount}>{room.itemCount} items</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
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
});
