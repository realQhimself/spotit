/**
 * Overlay that renders bounding boxes and labels on top of the camera preview.
 *
 * Each detection is drawn as an absolute-positioned View with a green border,
 * plus a compact label badge showing the class name and confidence percentage.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DetectionBadge } from './DetectionBadge';
import { colors } from '../../theme/colors';
import type { Detection } from '../../types/detection';

// ── Props ──────────────────────────────────────────────────────────────

interface DetectionOverlayProps {
  /** Array of current detections to render. */
  detections: Detection[];
  /** Width of the camera view in layout pixels. */
  viewWidth: number;
  /** Height of the camera view in layout pixels. */
  viewHeight: number;
}

// ── Component ──────────────────────────────────────────────────────────

export function DetectionOverlay({
  detections,
  viewWidth,
  viewHeight,
}: DetectionOverlayProps) {
  if (viewWidth === 0 || viewHeight === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {detections.map((detection) => {
        const { bbox } = detection;

        // Convert normalised bbox coordinates (0-1) to layout pixels.
        // If coordinates are already in pixels (> 1), use them directly.
        const isNormalised =
          bbox.x <= 1 && bbox.y <= 1 && bbox.width <= 1 && bbox.height <= 1;

        const left = isNormalised ? bbox.x * viewWidth : bbox.x;
        const top = isNormalised ? bbox.y * viewHeight : bbox.y;
        const width = isNormalised ? bbox.width * viewWidth : bbox.width;
        const height = isNormalised ? bbox.height * viewHeight : bbox.height;

        return (
          <View
            key={detection.id}
            style={[
              styles.box,
              {
                left,
                top,
                width,
                height,
              },
            ]}
          >
            {/* Label badge positioned above the bounding box */}
            <View style={styles.badgeContainer}>
              <DetectionBadge
                className={detection.className}
                confidence={detection.confidence}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.detection,
    borderRadius: 4,
  },
  badgeContainer: {
    position: 'absolute',
    top: -24,
    left: -1,
  },
});
