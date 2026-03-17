/**
 * Compact label badge shown above a detection bounding box.
 *
 * Displays the class name and confidence percentage on a semi-transparent
 * dark background with white text, e.g. "cup 94%".
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// ── Props ──────────────────────────────────────────────────────────────

interface DetectionBadgeProps {
  /** COCO class name (e.g. "cup", "cell phone"). */
  className: string;
  /** Model confidence score in range 0-1. */
  confidence: number;
}

// ── Component ──────────────────────────────────────────────────────────

export function DetectionBadge({ className, confidence }: DetectionBadgeProps) {
  const pct = Math.round(confidence * 100);

  return (
    <View style={styles.badge}>
      <Text style={styles.text} numberOfLines={1}>
        {className} {pct}%
      </Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
