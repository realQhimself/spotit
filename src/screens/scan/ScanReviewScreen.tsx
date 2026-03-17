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
import { showAlert } from '../../utils/alert';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import type Room from '../../database/models/Room';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';
import { createItem } from '../../database/helpers/itemHelpers';
import {
  createScan,
  createScanDetection,
  completeScan,
} from '../../database/helpers/scanHelpers';
import { getAllRooms, createRoom } from '../../database/helpers/roomHelpers';
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

// Mock data for development/testing when no real detections are available
const MOCK_DETECTIONS: DetectionItem[] = [
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

  // Fetch rooms for the picker
  useEffect(() => {
    const sub = getAllRooms().subscribe(setRooms);
    return () => sub.unsubscribe();
  }, []);

  // Convert store detections to UI format with colors
  // Fall back to mock data if no real detections are available (for development)
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
    return MOCK_DETECTIONS;
  });

  const handleDismiss = (id: string) => {
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
      const savePromises = detections.map(async (item) => {
        const originalDetection = originalDetections.find((d) => d.id === item.id);

        const createdItem = await createItem({
          name: item.name,
          category: item.category,
          roomId,
          zoneId: selectedZoneId ?? undefined,
          confidence: item.confidence,
          yoloClass: originalDetection?.className || item.category,
        });

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

      // 4. Clear detections from the store
      clearDetections();

      showAlert(
        'Items Saved',
        `Successfully saved ${detections.length} item${detections.length === 1 ? '' : 's'}.`,
        [{ text: 'OK', onPress: () => navigation.popToTop() }],
      );
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
