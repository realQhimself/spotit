import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { createItem } from '../../database/helpers/itemHelpers';
import { useScanStore } from '../../store/useScanStore';

type Props = StackScreenProps<ScanStackParamList, 'ScanReview'>;

interface DetectionItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  room: string;
  zone: string;
  color: string;
}

const INITIAL_DETECTIONS: DetectionItem[] = [
  { id: '1', name: 'Coffee Mug', category: 'Kitchenware', confidence: 0.94, room: 'Kitchen', zone: 'Counter', color: '#818CF8' },
  { id: '2', name: 'Laptop', category: 'Electronics', confidence: 0.91, room: 'Office', zone: 'Desk', color: '#34D399' },
  { id: '3', name: 'Phone', category: 'Electronics', confidence: 0.87, room: 'Office', zone: 'Desk', color: '#F59E0B' },
  { id: '4', name: 'Water Bottle', category: 'Kitchen', confidence: 0.82, room: 'Kitchen', zone: 'Counter', color: '#F87171' },
  { id: '5', name: 'Notebook', category: 'Office', confidence: 0.78, room: 'Office', zone: 'Desk', color: '#60A5FA' },
];

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return colors.success;
  if (confidence >= 0.7) return colors.warning;
  return colors.danger;
}

export default function ScanReviewScreen({ route, navigation }: Props) {
  const { scanId } = route.params;
  const [detections, setDetections] = useState(INITIAL_DETECTIONS);
  const [isSaving, setIsSaving] = useState(false);

  const handleDismiss = (id: string) => {
    setDetections((prev) => prev.filter((d) => d.id !== id));
  };

  const handleNameChange = (id: string, newName: string) => {
    setDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: newName } : d)),
    );
  };

  const handleSaveAll = async () => {
    const { selectedRoomId, selectedZoneId, clearDetections } =
      useScanStore.getState();

    if (!selectedRoomId) {
      Alert.alert(
        'No Room Selected',
        'Please select a room before saving items. Go back and choose a room from the scan settings.',
        [{ text: 'OK' }],
      );
      return;
    }

    if (detections.length === 0) {
      Alert.alert('No Items', 'There are no items to save.');
      return;
    }

    setIsSaving(true);

    try {
      const savePromises = detections.map((item) =>
        createItem({
          name: item.name,
          category: item.category,
          roomId: selectedRoomId,
          zoneId: selectedZoneId ?? undefined,
          confidence: item.confidence,
        }),
      );

      await Promise.all(savePromises);

      clearDetections();

      Alert.alert(
        'Items Saved',
        `Successfully saved ${detections.length} item${detections.length === 1 ? '' : 's'}.`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }],
      );
    } catch (error) {
      console.error('Failed to save items:', error);
      Alert.alert(
        'Save Failed',
        'Something went wrong while saving items. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Items</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{detections.length}</Text>
        </View>
      </View>

      {/* Photo Preview Placeholder */}
      <View style={styles.photoPreview}>
        <Text style={styles.photoPreviewIcon}>{'\u{1F4F8}'}</Text>
        <Text style={styles.photoPreviewText}>Scan Photo Preview</Text>
      </View>

      {/* Detection Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {detections.map((item) => {
          const confPercent = Math.round(item.confidence * 100);
          const confColor = getConfidenceColor(item.confidence);

          return (
            <View key={item.id} style={styles.detectionCard}>
              {/* Dismiss Button */}
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => handleDismiss(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.dismissButtonText}>{'\u2715'}</Text>
              </TouchableOpacity>

              <View style={styles.cardRow}>
                {/* Thumbnail */}
                <View style={[styles.thumbnail, { backgroundColor: item.color + '30' }]}>
                  <Text style={[styles.thumbnailText, { color: item.color }]}>
                    {item.name.charAt(0)}
                  </Text>
                </View>

                <View style={styles.cardContent}>
                  {/* Editable Name */}
                  <TextInput
                    style={styles.nameInput}
                    value={item.name}
                    onChangeText={(text) => handleNameChange(item.id, text)}
                    placeholder="Item name"
                    placeholderTextColor={colors.textTertiary}
                  />

                  {/* Category */}
                  <View style={styles.categoryRow}>
                    <Text style={styles.fieldLabel}>Category:</Text>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>{item.category}</Text>
                    </View>
                  </View>

                  {/* Room / Zone */}
                  <View style={styles.locationRow}>
                    <Text style={styles.fieldLabel}>Location:</Text>
                    <Text style={styles.locationText}>
                      {item.room} {'\u203A'} {item.zone}
                    </Text>
                  </View>

                  {/* Confidence Bar */}
                  <View style={styles.confidenceRow}>
                    <Text style={styles.fieldLabel}>Confidence:</Text>
                    <View style={styles.confidenceBarContainer}>
                      <View style={styles.confidenceBarBg}>
                        <View
                          style={[
                            styles.confidenceBarFill,
                            {
                              width: `${confPercent}%`,
                              backgroundColor: confColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.confidencePercent, { color: confColor }]}>
                        {confPercent}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSaveAll}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save All Items</Text>
          )}
        </TouchableOpacity>
      </View>
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
  photoPreview: {
    height: 120,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreviewIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  photoPreviewText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  detectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dismissButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dismissButtonText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: fontWeight.bold,
  },
  cardRow: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  thumbnailText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  cardContent: {
    flex: 1,
  },
  nameInput: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: spacing.sm,
    marginRight: spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  categoryChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing.sm,
  },
  locationText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  confidenceBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderLight,
  },
  confidenceBarFill: {
    height: 6,
    borderRadius: 3,
  },
  confidencePercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    width: 36,
    textAlign: 'right',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
});
