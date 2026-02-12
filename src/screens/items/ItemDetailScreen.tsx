import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RoomsStackParamList } from '../../types/navigation';
import database from '../../database';
import type Item from '../../database/models/Item';
import type Room from '../../database/models/Room';
import type Zone from '../../database/models/Zone';
import { deleteItem } from '../../database/helpers/itemHelpers';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return colors.success;
  if (confidence >= 0.7) return colors.warning;
  return colors.danger;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ItemData {
  item: Item;
  roomName: string;
  zoneName: string | null;
}

export default function ItemDetailScreen() {
  const route = useRoute<RouteProp<RoomsStackParamList, 'ItemDetail'>>();
  const navigation = useNavigation();
  const { itemId } = route.params;
  const [data, setData] = useState<ItemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const loadItem = useCallback(async () => {
    try {
      setIsLoading(true);
      const item = await database.get<Item>('items').find(itemId);
      let roomName = 'Unknown Room';
      let zoneName: string | null = null;

      try {
        const room = await database.get<Room>('rooms').find(item.roomId);
        roomName = room.name;
      } catch {
        // Room not found
      }

      if (item.zoneId) {
        try {
          const zone = await database.get<Zone>('zones').find(item.zoneId);
          zoneName = zone.name;
        } catch {
          // Zone not found
        }
      }

      setData({ item, roomName, zoneName });
      setIsFavorite(item.isFavorite);
    } catch (error) {
      console.error('Failed to load item:', error);
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      await database.write(async () => {
        const item = await database.get<Item>('items').find(itemId);
        await item.toggleFavorite();
      });
      setIsFavorite((prev) => !prev);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [itemId]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(itemId);
              navigation.goBack();
            } catch (error) {
              console.error('Failed to delete item:', error);
            }
          },
        },
      ],
    );
  }, [itemId, navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { item, roomName, zoneName } = data;
  const confPercent = Math.round(item.confidence * 100);
  const confColor = getConfidenceColor(item.confidence);
  const tags = item.tagsArray;
  const locationParts = [roomName];
  if (zoneName) locationParts.push(zoneName);
  if (item.layer > 0) locationParts.push(`Layer ${item.layer}`);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Placeholder */}
        <View style={styles.photoArea}>
          <Text style={styles.photoIcon}>{'\u{1F4F7}'}</Text>
          <Text style={styles.photoLabel}>Item Photo</Text>

          {/* Favorite Toggle */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
            activeOpacity={0.7}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '\u2764\u{FE0F}' : '\u{1F90D}'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Item Name & Category */}
        <View style={styles.titleSection}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        </View>

        {/* Location Breadcrumb */}
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>{'\u{1F4CD}'}</Text>
          <Text style={styles.locationText}>
            {locationParts.join(' \u203A ')}
          </Text>
        </View>

        {/* Description */}
        {item.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPTION</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        ) : null}

        {/* Tags */}
        {tags.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TAGS</Text>
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Last Seen */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAST SEEN</Text>
          <View style={styles.lastSeenRow}>
            <Text style={styles.lastSeenIcon}>{'\u{1F552}'}</Text>
            <View>
              <Text style={styles.lastSeenRelative}>
                {item.lastSeenAt ? formatRelativeTime(item.lastSeenAt) : 'Unknown'}
              </Text>
              <Text style={styles.lastSeenDate}>
                {item.lastSeenAt ? formatDate(item.lastSeenAt) : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Confidence */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETECTION CONFIDENCE</Text>
          <View style={styles.confidenceSection}>
            <View style={styles.confidenceBarBg}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${confPercent}%`, backgroundColor: confColor },
                ]}
              />
            </View>
            <Text style={[styles.confidencePercent, { color: confColor }]}>
              {confPercent}%
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
            <Text style={styles.editButtonText}>Edit Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  // Photo
  photoArea: {
    height: 220,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  photoLabel: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteIcon: {
    fontSize: 22,
  },
  // Title
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  // Sections
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.lg,
    color: colors.text,
    lineHeight: 24,
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  // Last Seen
  lastSeenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lastSeenIcon: {
    fontSize: 20,
  },
  lastSeenRelative: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  lastSeenDate: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Confidence
  confidenceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  confidenceBarFill: {
    height: 8,
    borderRadius: 4,
  },
  confidencePercent: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    width: 48,
    textAlign: 'right',
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  editButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.danger,
  },
});
