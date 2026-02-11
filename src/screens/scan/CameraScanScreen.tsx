import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { ScanStackParamList } from '../../types/navigation';
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
  const detectionCount = MOCK_BOUNDING_BOXES.length;

  const modeLabels: Record<string, string> = {
    quick: 'Quick Scan',
    room: 'Room Scan',
    area: 'Area Scan',
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
});
