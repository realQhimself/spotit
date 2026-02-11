import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RoomsStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

// This screen can appear in multiple stacks (Home, Rooms, Search).
// Using RoomsStackParamList as the primary type since it is the most
// common entry point.
type Props = StackScreenProps<RoomsStackParamList, 'ItemDetail'>;

const MOCK_ITEM = {
  id: 'i1',
  name: 'Coffee Maker',
  category: 'Appliance',
  description:
    'A stainless steel drip coffee maker with a 12-cup glass carafe. Features programmable brew timer and auto-shutoff functionality.',
  room: 'Kitchen',
  zone: 'Fridge',
  layer: 'Shelf 2',
  confidence: 0.97,
  tags: ['appliance', 'kitchen', 'stainless steel', 'coffee', 'countertop'],
  lastSeen: '2 hours ago',
  lastSeenDate: 'Feb 11, 2026',
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return colors.success;
  if (confidence >= 0.7) return colors.warning;
  return colors.danger;
}

export default function ItemDetailScreen({ route }: Props) {
  const { itemId } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);
  const confPercent = Math.round(MOCK_ITEM.confidence * 100);
  const confColor = getConfidenceColor(MOCK_ITEM.confidence);

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
            onPress={() => setIsFavorite(!isFavorite)}
            activeOpacity={0.7}
          >
            <Text style={styles.favoriteIcon}>
              {isFavorite ? '\u2764\u{FE0F}' : '\u{1F90D}'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Item Name & Category */}
        <View style={styles.titleSection}>
          <Text style={styles.itemName}>{MOCK_ITEM.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{MOCK_ITEM.category}</Text>
          </View>
        </View>

        {/* Location Breadcrumb */}
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>{'\u{1F4CD}'}</Text>
          <Text style={styles.locationText}>
            {MOCK_ITEM.room} {'\u203A'} {MOCK_ITEM.zone} {'\u203A'} {MOCK_ITEM.layer}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DESCRIPTION</Text>
          <Text style={styles.description}>{MOCK_ITEM.description}</Text>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TAGS</Text>
          <View style={styles.tagsContainer}>
            {MOCK_ITEM.tags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Last Seen */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LAST SEEN</Text>
          <View style={styles.lastSeenRow}>
            <Text style={styles.lastSeenIcon}>{'\u{1F552}'}</Text>
            <View>
              <Text style={styles.lastSeenRelative}>{MOCK_ITEM.lastSeen}</Text>
              <Text style={styles.lastSeenDate}>{MOCK_ITEM.lastSeenDate}</Text>
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
          <TouchableOpacity style={styles.deleteButton} activeOpacity={0.7}>
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
