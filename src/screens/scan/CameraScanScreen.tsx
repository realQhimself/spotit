import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
import type Room from '../../database/models/Room';
import type Zone from '../../database/models/Zone';
import { useScanStore } from '../../store/useScanStore';
import { getAllRooms } from '../../database/helpers/roomHelpers';
import { getZonesByRoom } from '../../database/helpers/zoneHelpers';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

type Props = StackScreenProps<ScanStackParamList, 'CameraScan'>;

// Mock bounding boxes to show what detection will look like
const MOCK_BOUNDING_BOXES = [
  { id: '1', label: 'cup', confidence: 94, x: 40, y: 180, width: 90, height: 80, color: colors.detection },
  { id: '2', label: 'laptop', confidence: 91, x: 180, y: 240, width: 140, height: 100, color: '#60A5FA' },
  { id: '3', label: 'phone', confidence: 87, x: 280, y: 140, width: 60, height: 100, color: '#F59E0B' },
];

export default function CameraScanScreen({ route, navigation }: Props) {
  const { mode } = route.params;
  const [flashOn, setFlashOn] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const detectionCount = MOCK_BOUNDING_BOXES.length;

  const {
    selectedRoomId,
    selectedZoneId,
    setRoom,
    setZone,
  } = useScanStore();

  const modeLabels: Record<string, string> = {
    quick: 'Quick Scan',
    room: 'Room Scan',
    area: 'Area Scan',
  };

  // Fetch rooms
  useEffect(() => {
    const sub = getAllRooms().subscribe(setRooms);
    return () => sub.unsubscribe();
  }, []);

  // Fetch zones when a room is selected
  useEffect(() => {
    if (!selectedRoomId) {
      setZones([]);
      return;
    }
    const sub = getZonesByRoom(selectedRoomId).subscribe(setZones);
    return () => sub.unsubscribe();
  }, [selectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const handleRoomSelect = (roomId: string) => {
    setRoom(roomId);
    setZone(null); // Clear zone when changing room
    setShowRoomPicker(false);
  };

  const handleZoneSelect = (zoneId: string) => {
    setZone(zoneId);
    setShowZonePicker(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Camera Preview Placeholder */}
      <View style={styles.cameraPreview}>
        <Text style={styles.cameraPlaceholder}>Camera Preview</Text>
        <Text style={styles.cameraMode}>{modeLabels[mode]}</Text>

        {/* Mock Bounding Boxes */}
        {MOCK_BOUNDING_BOXES.map((box) => (
          <View
            key={box.id}
            style={[
              styles.boundingBox,
              {
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                borderColor: box.color,
              },
            ]}
          >
            <View style={[styles.boxLabel, { backgroundColor: box.color }]}>
              <Text style={styles.boxLabelText}>
                {box.label} {box.confidence}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.topButtonText}>{'\u2190'}</Text>
        </TouchableOpacity>

        <View style={styles.topCenter}>
          {detectionCount > 0 && (
            <View style={styles.detectionBadge}>
              <Text style={styles.detectionBadgeText}>
                {detectionCount} detected
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.topButton} activeOpacity={0.7}>
          <Text style={styles.topButtonText}>{'\u2699'}</Text>
        </TouchableOpacity>
      </View>

      {/* Room/Zone Selector Bar */}
      <View style={styles.selectorBar}>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowRoomPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.selectorIcon}>{'\u{1F3E0}'}</Text>
          <View style={styles.selectorTextContainer}>
            <Text style={styles.selectorLabel}>Room</Text>
            <Text style={styles.selectorValue} numberOfLines={1}>
              {selectedRoom ? selectedRoom.name : 'Select Room'}
            </Text>
          </View>
        </TouchableOpacity>

        {selectedRoomId && zones.length > 0 && (
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowZonePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.selectorIcon}>{'\u{1F4CD}'}</Text>
            <View style={styles.selectorTextContainer}>
              <Text style={styles.selectorLabel}>Zone</Text>
              <Text style={styles.selectorValue} numberOfLines={1}>
                {selectedZone ? selectedZone.name : 'Select Zone'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {/* Controls Row */}
        <View style={styles.controlsRow}>
          {/* Room Selector */}
          <TouchableOpacity style={styles.controlButton} activeOpacity={0.7}>
            <View style={styles.roomSelectorIcon}>
              <Text style={styles.controlIcon}>{'\u{1F3E0}'}</Text>
            </View>
            <Text style={styles.controlLabel}>Room</Text>
          </TouchableOpacity>

          {/* Capture Button */}
          <TouchableOpacity
            style={styles.captureButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ScanReview', { scanId: 'mock-scan-1' })}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          {/* Flash Toggle */}
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFlashOn(!flashOn)}
            activeOpacity={0.7}
          >
            <View style={[styles.flashIcon, flashOn && styles.flashIconOn]}>
              <Text style={styles.controlIcon}>
                {flashOn ? '\u{26A1}' : '\u{1F526}'}
              </Text>
            </View>
            <Text style={styles.controlLabel}>
              {flashOn ? 'Flash On' : 'Flash Off'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Room Picker Modal */}
      <Modal
        visible={showRoomPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoomPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Room</Text>
              <TouchableOpacity
                onPress={() => setShowRoomPicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.id === selectedRoomId && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleRoomSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      item.id === selectedRoomId && styles.pickerItemTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.id === selectedRoomId && (
                    <Text style={styles.checkmark}>{'\u2713'}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>
                    No rooms available. Create one first.
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Zone Picker Modal */}
      <Modal
        visible={showZonePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowZonePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Zone</Text>
              <TouchableOpacity
                onPress={() => setShowZonePicker(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={zones}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerItem,
                    item.id === selectedZoneId && styles.pickerItemSelected,
                  ]}
                  onPress={() => handleZoneSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.zoneItemContent}>
                    <Text
                      style={[
                        styles.pickerItemText,
                        item.id === selectedZoneId && styles.pickerItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.zoneTypeText}>{item.zoneType}</Text>
                  </View>
                  {item.id === selectedZoneId && (
                    <Text style={styles.checkmark}>{'\u2713'}</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>
                    No zones in this room.
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setZone(null);
                setShowZonePicker(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear Zone Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A2E',
  },
  cameraPlaceholder: {
    fontSize: fontSize.xl,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: fontWeight.semibold,
  },
  cameraMode: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.3)',
    marginTop: spacing.sm,
  },
  // Mock bounding boxes
  boundingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: borderRadius.xs,
  },
  boxLabel: {
    position: 'absolute',
    top: -20,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  boxLabelText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: '#FFFFFF',
  },
  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  detectionBadge: {
    backgroundColor: colors.detection,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  detectionBadgeText: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 44,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlButton: {
    width: 64,
    alignItems: 'center',
  },
  roomSelectorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: {
    fontSize: 22,
  },
  controlLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: fontWeight.medium,
  },
  flashIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashIconOn: {
    backgroundColor: 'rgba(245,158,11,0.3)',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.border,
  },
  // Selector bar
  selectorBar: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectorIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: fontWeight.medium,
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: fontWeight.semibold,
  },
  // Modal styles
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
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  pickerItemText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  zoneItemContent: {
    flex: 1,
  },
  zoneTypeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
  clearButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: borderRadius.md,
  },
  clearButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});
