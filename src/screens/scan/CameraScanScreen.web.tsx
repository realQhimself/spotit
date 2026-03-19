/**
 * Web camera scan screen — STATIC SCAN MODE.
 *
 * Shows a live camera preview (no AI running). User taps capture,
 * then the photo is sent to Gemini for comprehensive item detection.
 * This avoids the WASM memory crash that live ONNX detection causes
 * on mobile Safari.
 */

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
import { detectItemsFromPhoto } from '../../services/cloudAiService';
import type { Detection } from '../../types/detection';

type Props = StackScreenProps<ScanStackParamList, 'CameraScan'>;

export default function CameraScanScreen({ route, navigation }: Props) {
  const mode = route.params?.mode ?? 'quick';
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    selectedRoomId,
    selectedZoneId,
    setRoom,
    setZone,
  } = useScanStore();

  // ── Camera setup via getUserMedia (preview only, no AI) ──────────────
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
            if (!cancelled) setCameraReady(true);
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

    initCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

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

  // ── Capture + Analyze handler ─────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    const store = useScanStore.getState();

    try {
      // 1. Capture frame from video
      const video = videoRef.current;
      let photoUri = '';
      let imageBase64 = '';

      if (video && video.readyState >= 2) {
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          photoUri = captureCanvas.toDataURL('image/jpeg', 0.85);
          // Extract base64 data (remove the data:image/jpeg;base64, prefix)
          imageBase64 = photoUri.split(',')[1] || '';
          store.setCapturedPhoto(photoUri);
        }
      }

      // 2. Send to Gemini for comprehensive detection
      store.clearDetections();

      if (imageBase64) {
        const geminiItems = await detectItemsFromPhoto(imageBase64);

        // Convert Gemini results to Detection format
        const detections: Detection[] = geminiItems.map((item, idx) => ({
          id: `gemini-${Date.now()}-${idx}`,
          classId: idx,
          className: item.name,
          confidence: item.confidence,
          bbox: { x: 0, y: 0, width: 0, height: 0 },
          enrichmentStatus: 'enriched' as const,
          enrichment: {
            name: item.name,
            category: item.category,
            subcategory: '',
            brand: item.brand,
            color: item.color,
            material: '',
            sizeEstimate: '',
            description: item.description,
            tags: item.tags,
          },
        }));

        for (const det of detections) {
          store.addDetection(det);
        }
      }

      // 3. Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // 4. Navigate to review
      navigation.navigate('ScanReview', { scanId: `web-scan-${Date.now()}` });
    } catch (err) {
      console.warn('Capture/analyze failed:', err);
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, navigation]);

  // ── Error states ──────────────────────────────────────────────────────
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HTML5 Video Feed — preview only, no AI running */}
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

      {/* Analyzing overlay */}
      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.analyzingText}>Analyzing photo...</Text>
          <Text style={styles.analyzingSubtext}>AI is identifying all items</Text>
        </View>
      )}

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.topButtonText}>{'\u2190'}</Text>
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>Photo Scan</Text>
          </View>
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

      {/* Hint text */}
      {!isAnalyzing && cameraReady && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Point at items and tap the button to scan</Text>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setShowRoomPicker(true)} activeOpacity={0.7}>
            <View style={styles.roomSelectorIcon}>
              <Text style={styles.controlIcon}>{'\u{1F3E0}'}</Text>
            </View>
            <Text style={styles.controlLabel}>Room</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isAnalyzing && { opacity: 0.4 }]}
            activeOpacity={0.8}
            onPress={handleCapture}
            disabled={isAnalyzing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.controlButton}>
            <View style={styles.flashIcon}>
              <Text style={styles.controlIcon}>{'\u{1F4F7}'}</Text>
            </View>
            <Text style={styles.controlLabel}>Photo</Text>
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
  errorText: { fontSize: fontSize.lg, color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  retryButton: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
  retryButtonText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
  // Analyzing overlay
  analyzingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  analyzingText: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#FFFFFF', marginTop: spacing.lg },
  analyzingSubtext: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: spacing.sm },
  // Top bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, zIndex: 5 },
  topButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  topButtonText: { fontSize: 22, color: '#FFFFFF' },
  topCenter: { flex: 1, alignItems: 'center' },
  modeBadge: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: borderRadius.full },
  modeBadgeText: { fontSize: 13, fontWeight: fontWeight.semibold, color: '#FFFFFF' },
  // Hint
  hintContainer: { position: 'absolute', bottom: 140, left: 0, right: 0, alignItems: 'center', zIndex: 5 },
  hintText: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.full, overflow: 'hidden' },
  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 44, paddingHorizontal: spacing.md, paddingTop: spacing.md, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 5 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  controlButton: { width: 64, alignItems: 'center' },
  roomSelectorIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  controlIcon: { fontSize: 22 },
  controlLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: fontWeight.medium },
  flashIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  captureButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.border },
  // Selector bar
  selectorBar: { position: 'absolute', top: 116, left: 0, right: 0, flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, zIndex: 5 },
  selectorButton: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: borderRadius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  selectorIcon: { fontSize: 24, marginRight: spacing.sm },
  selectorTextContainer: { flex: 1 },
  selectorLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: fontWeight.medium, marginBottom: 2 },
  selectorValue: { fontSize: 13, color: '#FFFFFF', fontWeight: fontWeight.semibold },
  // Modal
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
