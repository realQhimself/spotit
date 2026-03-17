import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
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
import { useObjectDetection } from '../../ml/useObjectDetection';

type Props = StackScreenProps<ScanStackParamList, 'CameraScan'>;

export default function CameraScanScreen({ route, navigation }: Props) {
  const mode = route.params?.mode ?? 'quick';
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    detections,
    modelState,
    videoRef: videoRefOpt,
    startDetection: startDetectionOpt,
    stopDetection: stopDetectionOpt,
  } = useObjectDetection();
  const videoRef = videoRefOpt!;
  const startDetection = startDetectionOpt!;
  const stopDetection = stopDetectionOpt!;
  const detectionCount = detections.length;

  const {
    selectedRoomId,
    selectedZoneId,
    setRoom,
    setZone,
  } = useScanStore();

  // ── Camera setup via getUserMedia ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            // Small delay to let the video stabilize before starting detection
            setTimeout(() => {
              if (!cancelled) startDetection();
            }, 500);
          };
        }
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(
            err?.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access and refresh.'
              : 'Camera not available on this device.',
          );
        }
      }
    }

    if (modelState === 'ready') {
      initCamera();
    }

    return () => {
      cancelled = true;
      stopDetection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [modelState]);

  // ── Fetch rooms ──────────────────────────────────────────────────────
  useEffect(() => {
    const sub = getAllRooms().subscribe(setRooms);
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedRoomId) { setZones([]); return; }
    const sub = getZonesByRoom(selectedRoomId).subscribe(setZones);
    return () => sub.unsubscribe();
  }, [selectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const handleRoomSelect = (roomId: string) => {
    setRoom(roomId);
    setZone(null);
    setShowRoomPicker(false);
  };

  const handleZoneSelect = (zoneId: string) => {
    setZone(zoneId);
    setShowZonePicker(false);
  };

  // ── Measure container for bbox scaling ───────────────────────────────
  const onLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  }, []);

  // ── Draw bounding boxes on canvas overlay ────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || containerSize.width === 0) return;

    canvas.width = containerSize.width;
    canvas.height = containerSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = containerSize.width / 640;
    const scaleY = containerSize.height / 640;

    for (const det of detections) {
      const { bbox } = det;
      const x = bbox.x * scaleX;
      const y = bbox.y * scaleY;
      const w = bbox.width * scaleX;
      const h = bbox.height * scaleY;

      ctx.strokeStyle = colors.detection;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      const label = `${det.className} ${Math.round(det.confidence * 100)}%`;
      ctx.font = 'bold 12px sans-serif';
      const textW = ctx.measureText(label).width;
      ctx.fillStyle = colors.detection;
      ctx.fillRect(x, y - 18, textW + 8, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, x + 4, y - 4);
    }
  }, [detections, containerSize]);

  // ── Capture handler ──────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    stopDetection();
    const store = useScanStore.getState();

    // Capture a frame from the video as a photo
    try {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const photoUri = captureCanvas.toDataURL('image/jpeg', 0.85);
          store.setCapturedPhoto(photoUri);
        }
      }
    } catch (err) {
      console.warn('Failed to capture photo frame:', err);
    }

    // Store detections
    store.clearDetections();
    for (const det of detections) {
      store.addDetection(det);
    }

    // Stop camera stream before navigating away
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    navigation.navigate('ScanReview', { scanId: `web-scan-${Date.now()}` });
  }, [detections, navigation, stopDetection]);

  // ── Loading state ────────────────────────────────────────────────────
  if (modelState === 'idle' || modelState === 'loading') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading AI detection model...</Text>
          <Text style={styles.loadingSubtext}>First load may take a few seconds</Text>
        </View>
      </View>
    );
  }

  if (modelState === 'error') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load detection model</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cameraError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{cameraError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <StatusBar barStyle="light-content" />

      {/* HTML5 Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        } as any}
      />

      {/* Canvas overlay for bounding boxes */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        } as any}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topButton} onPress={() => { stopDetection(); navigation.goBack(); }} activeOpacity={0.7}>
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

        <View style={styles.topButton} />
      </View>

      {/* Room/Zone Selector Bar */}
      <View style={styles.selectorBar}>
        <TouchableOpacity style={styles.selectorButton} onPress={() => setShowRoomPicker(true)} activeOpacity={0.7}>
          <Text style={styles.selectorIcon}>{'\u{1F3E0}'}</Text>
          <View style={styles.selectorTextContainer}>
            <Text style={styles.selectorLabel}>Room</Text>
            <Text style={styles.selectorValue} numberOfLines={1}>
              {selectedRoom ? selectedRoom.name : 'Select Room'}
            </Text>
          </View>
        </TouchableOpacity>

        {selectedRoomId && zones.length > 0 && (
          <TouchableOpacity style={styles.selectorButton} onPress={() => setShowZonePicker(true)} activeOpacity={0.7}>
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
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setShowRoomPicker(true)} activeOpacity={0.7}>
            <View style={styles.roomSelectorIcon}>
              <Text style={styles.controlIcon}>{'\u{1F3E0}'}</Text>
            </View>
            <Text style={styles.controlLabel}>Room</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} activeOpacity={0.8} onPress={handleCapture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.controlButton}>
            <View style={styles.flashIcon}>
              <Text style={styles.controlIcon}>{'\u{1F4F7}'}</Text>
            </View>
            <Text style={styles.controlLabel}>Web</Text>
          </View>
        </View>
      </View>

      {/* Room Picker Modal */}
      {showRoomPicker && <Modal visible transparent animationType="slide" onRequestClose={() => setShowRoomPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Room</Text>
              <TouchableOpacity onPress={() => setShowRoomPicker(false)} activeOpacity={0.7}>
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={rooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item.id === selectedRoomId && styles.pickerItemSelected]}
                  onPress={() => handleRoomSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerItemText, item.id === selectedRoomId && styles.pickerItemTextSelected]}>
                    {item.name}
                  </Text>
                  {item.id === selectedRoomId && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>No rooms available. Create one first.</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>}

      {/* Zone Picker Modal */}
      {showZonePicker && <Modal visible transparent animationType="slide" onRequestClose={() => setShowZonePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Zone</Text>
              <TouchableOpacity onPress={() => setShowZonePicker(false)} activeOpacity={0.7}>
                <Text style={styles.modalClose}>{'\u2715'}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={zones}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item.id === selectedZoneId && styles.pickerItemSelected]}
                  onPress={() => handleZoneSelect(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.zoneItemContent}>
                    <Text style={[styles.pickerItemText, item.id === selectedZoneId && styles.pickerItemTextSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.zoneTypeText}>{item.zoneType}</Text>
                  </View>
                  {item.id === selectedZoneId && <Text style={styles.checkmark}>{'\u2713'}</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>No zones in this room.</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => { setZone(null); setShowZonePicker(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>Clear Zone Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', paddingHorizontal: spacing.xl },
  loadingText: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
  loadingSubtext: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.4)', marginTop: spacing.sm, textAlign: 'center' },
  errorText: { fontSize: fontSize.lg, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  retryButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  topButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  topButtonText: { fontSize: 22, color: '#FFFFFF' },
  topCenter: { flex: 1, alignItems: 'center' },
  detectionBadge: { backgroundColor: colors.detection, paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full },
  detectionBadgeText: { fontSize: 13, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 44, paddingHorizontal: spacing.md, paddingTop: spacing.md, backgroundColor: 'rgba(0,0,0,0.6)' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  controlButton: { width: 64, alignItems: 'center' },
  roomSelectorIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  controlIcon: { fontSize: 22 },
  controlLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: fontWeight.medium },
  flashIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  captureButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.border },
  selectorBar: { position: 'absolute', top: 116, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm },
  selectorButton: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  selectorIcon: { fontSize: 24, marginRight: spacing.sm },
  selectorTextContainer: { flex: 1 },
  selectorLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: fontWeight.medium, marginBottom: 2 },
  selectorValue: { fontSize: 13, color: '#FFFFFF', fontWeight: fontWeight.semibold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, paddingTop: spacing.md, paddingBottom: 44, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  modalClose: { fontSize: 20, color: colors.textSecondary, paddingHorizontal: spacing.sm },
  pickerItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemSelected: { backgroundColor: 'rgba(99,102,241,0.1)' },
  pickerItemText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  pickerItemTextSelected: { color: colors.primary, fontWeight: fontWeight.semibold },
  checkmark: { fontSize: 18, color: colors.primary, fontWeight: fontWeight.bold },
  zoneItemContent: { flex: 1 },
  zoneTypeText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  emptyPicker: { paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, alignItems: 'center' },
  emptyPickerText: { fontSize: fontSize.md, color: colors.textSecondary, textAlign: 'center' },
  clearButton: { marginHorizontal: spacing.lg, marginTop: spacing.md, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.border, borderRadius: borderRadius.md },
  clearButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.textSecondary },
});
