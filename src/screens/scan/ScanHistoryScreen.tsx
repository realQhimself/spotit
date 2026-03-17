import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import type Scan from '../../database/models/Scan';
import type Room from '../../database/models/Room';
import type Zone from '../../database/models/Zone';
import { getRecentScans } from '../../database/helpers/scanHelpers';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<ScanStackParamList, 'ScanHistory'>;

// Helper function to format relative time
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

// Helper function to get status color
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return colors.success;
    case 'processing':
      return colors.warning;
    case 'failed':
      return colors.danger;
    default:
      return colors.textSecondary;
  }
}

// Helper function to get status label
function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'processing':
      return 'Processing';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

interface ScanWithRelations extends Scan {
  roomData?: Room;
  zoneData?: Zone;
}

function ScanCard({
  scan,
  onPress,
}: {
  scan: ScanWithRelations;
  onPress: () => void;
}) {
  const [roomName, setRoomName] = useState<string>('');
  const [zoneName, setZoneName] = useState<string>('');

  useEffect(() => {
    // Fetch room name
    (async () => {
      try {
        const room = await (scan as any).room.fetch();
        setRoomName(room?.name || 'Unknown Room');
      } catch (err) {
        setRoomName('Unknown Room');
      }
    })();
  }, [scan]);

  useEffect(() => {
    // Fetch zone name if zoneId exists
    if (scan.zoneId) {
      (async () => {
        try {
          const zonesCollection = (scan as any).collections.get('zones');
          const zone = await zonesCollection.find(scan.zoneId);
          setZoneName(zone?.name || '');
        } catch (err) {
          setZoneName('');
        }
      })();
    }
  }, [scan]);

  const statusColor = getStatusColor(scan.status);
  const statusLabel = getStatusLabel(scan.status);

  return (
    <TouchableOpacity
      style={styles.scanCard}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Thumbnail Section */}
      <View style={styles.thumbnailContainer}>
        {scan.photoUri ? (
          <Image source={{ uri: scan.photoUri }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailIcon}>{'\u{1F4F7}'}</Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.cardContent}>
        {/* Location */}
        <View style={styles.locationRow}>
          <Text style={styles.roomIcon}>{'\u{1F6AA}'}</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {roomName}
            {zoneName ? ` ${'\u203A'} ${zoneName}` : ''}
          </Text>
        </View>

        {/* Date and Scan Type */}
        <Text style={styles.dateText}>{timeAgo(scan.createdAt)}</Text>

        {/* Status and Detection Count */}
        <View style={styles.metaRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          {scan.status === 'completed' && scan.detectionCount > 0 && (
            <View style={styles.detectionBadge}>
              <Text style={styles.detectionIcon}>{'\u{1F50D}'}</Text>
              <Text style={styles.detectionCount}>{scan.detectionCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>{'\u203A'}</Text>
    </TouchableOpacity>
  );
}

export default function ScanHistoryScreen({ navigation }: Props) {
  const [scans, setScans] = useState<Scan[]>([]);

  useEffect(() => {
    const subscription = getRecentScans(50).subscribe(setScans);
    return () => subscription.unsubscribe();
  }, []);

  const handleScanPress = (scan: Scan) => {
    if (scan.status === 'completed') {
      // Navigate to scan review or detail screen
      navigation.navigate('ScanReview', { scanId: scan.id });
    } else {
      showAlert(
        'Scan Not Complete',
        'This scan is still processing or has failed.',
        [{ text: 'OK' }],
      );
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{'\u{1F4F7}'}</Text>
      <Text style={styles.emptyTitle}>No Scans Yet</Text>
      <Text style={styles.emptyText}>
        Start scanning rooms to see your scan history here.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{scans.length}</Text>
        </View>
      </View>

      {/* Scan List */}
      <FlatList
        data={scans}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ScanCard scan={item} onPress={() => handleScanPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  countBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.md,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailContainer: {
    marginRight: spacing.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  roomIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locationText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  detectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  detectionIcon: {
    fontSize: 10,
  },
  detectionCount: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textTertiary,
    paddingHorizontal: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
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
    lineHeight: 22,
  },
});
