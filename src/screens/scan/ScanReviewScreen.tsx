import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { showAlert } from '../../utils/alert';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import type Room from '../../database/models/Room';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { createItem, updateItem } from '../../database/helpers/itemHelpers';
import {
  createScan,
  createScanDetection,
  completeScan,
} from '../../database/helpers/scanHelpers';
import { getAllRooms, getRoomById, createRoom } from '../../database/helpers/roomHelpers';
import { useScanStore } from '../../store/useScanStore';
import { cropBoundingBox, imageToBase64 } from '../../ml/imageUtils';
import { enrichmentQueue } from '../../services/enrichmentQueue';

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

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return colors.success;
  if (confidence >= 0.7) return colors.warning;
  return colors.danger;
}

function getRandomColor(index: number): string {
  const palette = ['#818CF8', '#34D399', '#F59E0B', '#F87171', '#60A5FA', '#A78BFA', '#FB923C'];
  return palette[index % palette.length];
}

export default function ScanReviewScreen({ route, navigation }: Props) {
  const { scanId } = route.params;
  const storeDetections = useScanStore((state) => state.detections);
  const [isSaving, setIsSaving] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [savedRoomName, setSavedRoomName] = useState('');

  // Fetch rooms for the picker
  useEffect(() => {
    const sub = getAllRooms().subscribe(setRooms);
    return () => sub.unsubscribe();
  }, []);

  // Convert store detections to UI format with colors
  // Empty array if no real detections are available
  const [detections, setDetections] = useState<DetectionItem[]>(() => {
    if (storeDetections.length > 0) {
      return storeDetections.map((d, idx) => ({
        id: d.id,
        name: d.enrichment?.name || d.className,
        category: d.enrichment?.category || d.className,
        confidence: d.confidence,
        room: '',
        zone: '',
        color: getRandomColor(idx),
      }));
    }
    return [];
  });

  const handleDismiss = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDetections((prev) => prev.filter((d) => d.id !== id));
  };

  const handleNameChange = (id: string, newName: string) => {
    setDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: newName } : d)),
    );
  };

  const handleRoomSelected = useCallback(async (roomId: string) => {
    useScanStore.getState().setRoom(roomId);
    setShowRoomPicker(false);
    // Proceed to save with the newly selected room
    await saveWithRoom(roomId);
  }, [detections, navigation]);

  const handleCreateAndSelect = useCallback(async () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;
    setIsCreatingRoom(true);
    try {
      const room = await createRoom(trimmed);
      setNewRoomName('');
      useScanStore.getState().setRoom(room.id);
      setShowRoomPicker(false);
      // Proceed to save with the newly created room
      await saveWithRoom(room.id);
    } catch (err) {
      console.error('Failed to create room:', err);
      showAlert('Error', 'Failed to create room. Please try again.');
    } finally {
      setIsCreatingRoom(false);
    }
  }, [newRoomName, detections, navigation]);

  const saveWithRoom = async (roomId: string) => {
    const {
      selectedZoneId,
      scanMode,
      capturedPhotoUri,
      clearDetections,
      detections: originalDetections,
    } = useScanStore.getState();

    if (detections.length === 0) {
      showAlert('No Items', 'There are no items to save.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Create the Scan record
      const scan = await createScan({
        roomId,
        zoneId: selectedZoneId,
        scanType: scanMode || 'quick',
        photoUri: capturedPhotoUri,
      });

      // 2. Create Items and ScanDetections for each detection
      // Track created item IDs for enrichment pipeline
      const createdItems: { itemId: string; detectionId: string }[] = [];

      const savePromises = detections.map(async (item) => {
        const originalDetection = originalDetections.find((d) => d.id === item.id);

        // Crop thumbnail from the photo if we have a bbox and photo
        let thumbnailUri: string | undefined;
        if (capturedPhotoUri && originalDetection?.bbox) {
          try {
            thumbnailUri = await cropBoundingBox(
              capturedPhotoUri,
              originalDetection.bbox,
              0, // imageWidth — cropBoundingBox currently returns original URI
              0, // imageHeight — will be used once cropping is implemented
            );
          } catch (err) {
            console.warn('[ScanReview] Failed to crop thumbnail:', err);
          }
        }

        const createdItem = await createItem({
          name: item.name,
          category: item.category,
          roomId,
          zoneId: selectedZoneId ?? undefined,
          confidence: item.confidence,
          yoloClass: originalDetection?.className || item.category,
          thumbnailUri,
        });

        createdItems.push({ itemId: createdItem.id, detectionId: item.id });

        if (originalDetection || originalDetections.length === 0) {
          await createScanDetection({
            scanId: scan.id,
            itemId: createdItem.id,
            yoloClass: originalDetection?.className || item.category,
            confidence: item.confidence,
            bbox: originalDetection?.bbox
              ? [
                  originalDetection.bbox.x,
                  originalDetection.bbox.y,
                  originalDetection.bbox.width,
                  originalDetection.bbox.height,
                ]
              : [0, 0, 0, 0],
            status: 'matched',
          });
        }
      });

      await Promise.all(savePromises);

      // 3. Mark the scan as completed
      await completeScan(scan.id, detections.length);

      // 4. Start background enrichment pipeline
      if (capturedPhotoUri) {
        // Set up the enrichment callback to update items in the database
        enrichmentQueue.onItemEnriched = async (itemId, result) => {
          try {
            await updateItem(itemId, {
              name: result.name,
              category: result.category,
              subcategory: result.subcategory || null,
              description: result.description || null,
              tags: result.tags ? JSON.stringify(result.tags) : null,
              cloudAiEnriched: 'true',
            });
          } catch (err) {
            console.warn('[ScanReview] Failed to update enriched item:', err);
          }
        };

        // Queue each detection for enrichment
        for (const { itemId, detectionId } of createdItems) {
          const originalDetection = originalDetections.find((d) => d.id === detectionId);
          try {
            let croppedUri = capturedPhotoUri;
            if (originalDetection?.bbox) {
              croppedUri = await cropBoundingBox(
                capturedPhotoUri,
                originalDetection.bbox,
                0,
                0,
              );
            }
            const base64 = await imageToBase64(croppedUri);
            enrichmentQueue.add(itemId, base64);
          } catch (err) {
            console.warn('[ScanReview] Failed to queue enrichment for', itemId, err);
          }
        }
      }

      // 5. Clear detections from the store
      clearDetections();

      // 6. Haptic feedback on success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 7. Show success card instead of alert
      const count = detections.length;
      let roomName = 'this room';
      try {
        const room = await getRoomById(roomId);
        roomName = room.name;
      } catch {
        // fallback to generic name
      }
      setSavedCount(count);
      setSavedRoomName(roomName);
      setShowSuccessCard(true);
    } catch (error) {
      console.error('Failed to save items:', error);
      showAlert(
        'Save Failed',
        'Something went wrong while saving items. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAll = async () => {
    const { selectedRoomId } = useScanStore.getState();

    if (!selectedRoomId) {
      // Instead of blocking, show room picker so user can choose or create a room
      setShowRoomPicker(true);
      return;
    }

    await saveWithRoom(selectedRoomId);
  };

  const handleSuccessDismiss = () => {
    setShowSuccessCard(false);
    navigation.popToTop();
  };

  // ── Empty state ───────────────────────────────────────────────────────
  if (detections.length === 0 && !showSuccessCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Review Items</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>0</Text>
          </View>
        </View>

        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>{'\uD83D\uDCF7'}</Text>
          <Text style={styles.emptyStateTitle}>No items detected</Text>
          <Text style={styles.emptyStateSubtitle}>
            Try scanning again with better lighting or a different angle
          </Text>
          <TouchableOpacity
            style={styles.scanAgainButton}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.scanAgainButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Success card ──────────────────────────────────────────────────────
  if (showSuccessCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>{'\u2705'}</Text>
            <Text style={styles.successTitle}>Scan Complete!</Text>
            <Text style={styles.successDetail}>
              {savedCount} new item{savedCount === 1 ? '' : 's'} saved to {savedRoomName}
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              activeOpacity={0.8}
              onPress={handleSuccessDismiss}
            >
              <Text style={styles.successButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          style={[
            styles.saveButton,
            (isSaving || detections.length === 0) && styles.saveButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleSaveAll}
          disabled={isSaving || detections.length === 0}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save All Items</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Room Picker Modal — shown when saving without a room selected */}
      <Modal
        visible={showRoomPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoomPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Room</Text>
              <TouchableOpacity
                onPress={() => setShowRoomPicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Choose where to save these items, or create a new room.
            </Text>

            {/* Create New Room */}
            <View style={styles.createRoomRow}>
              <TextInput
                style={styles.createRoomInput}
                placeholder="New room name..."
                placeholderTextColor={colors.textTertiary}
                value={newRoomName}
                onChangeText={setNewRoomName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCreateAndSelect}
              />
              <TouchableOpacity
                style={[
                  styles.createRoomButton,
                  (!newRoomName.trim() || isCreatingRoom) && styles.createRoomButtonDisabled,
                ]}
                onPress={handleCreateAndSelect}
                disabled={!newRoomName.trim() || isCreatingRoom}
                activeOpacity={0.7}
              >
                {isCreatingRoom ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.createRoomButtonText}>+ Create</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Existing Rooms List */}
            {rooms.length > 0 && (
              <Text style={styles.existingRoomsLabel}>Existing rooms</Text>
            )}

            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleRoomSelected(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerItemIcon}>{'\u{1F3E0}'}</Text>
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  <Text style={styles.pickerArrow}>{'\u203A'}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>
                    No rooms yet. Create your first room above!
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
  // ── Empty state ───────────────────────────────────────────────────────
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  scanAgainButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  scanAgainButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  // ── Success card ──────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  successIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  successDetail: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  successButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    alignItems: 'center',
  },
  successButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  // Room Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.md,
    paddingBottom: 44,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalClose: {
    fontSize: 20,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  createRoomRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  createRoomInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createRoomButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createRoomButtonDisabled: {
    opacity: 0.5,
  },
  createRoomButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  existingRoomsLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  pickerItemIcon: {
    fontSize: 20,
  },
  pickerItemText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  pickerArrow: {
    fontSize: 20,
    color: colors.textTertiary,
  },
  emptyPicker: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
