/**
 * Camera preview wrapper component.
 *
 * Currently renders a placeholder dark view with a pulsing activity dot.
 * Once react-native-vision-camera is installed, this will wrap the native
 * <Camera /> component.
 *
 * Requires (not yet installed):
 *   - react-native-vision-camera
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

// ── Props ──────────────────────────────────────────────────────────────

interface CameraViewProps {
  /** Whether the camera should be active. */
  isActive: boolean;
  /** Optional style overrides for the container. */
  style?: ViewStyle;
}

// ── Component ──────────────────────────────────────────────────────────

export function CameraView({ isActive, style }: CameraViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      pulseAnim.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isActive, pulseAnim]);

  return (
    <View style={[styles.container, style]}>
      {/* Placeholder — replace with <Camera /> from react-native-vision-camera */}
      <Text style={styles.label}>Camera Preview</Text>
      {isActive && (
        <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textTertiary,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.detection,
  },
});
