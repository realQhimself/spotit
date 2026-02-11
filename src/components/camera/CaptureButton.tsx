/**
 * Large circular capture button with press-scale animation.
 *
 * Renders a white circle (70 px) with a thin outer ring border, similar to
 * standard camera-app shutter buttons.
 */

import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

// ── Props ──────────────────────────────────────────────────────────────

interface CaptureButtonProps {
  /** Called when the user taps the button. */
  onPress: () => void;
  /** When true the button is grayed out and non-interactive. */
  disabled?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────

const OUTER_SIZE = 80;
const INNER_SIZE = 70;
const BORDER_WIDTH = 3;

// ── Component ──────────────────────────────────────────────────────────

export function CaptureButton({ onPress, disabled = false }: CaptureButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.outerRing,
          disabled && styles.outerRingDisabled,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Animated.View
          style={[
            styles.innerCircle,
            disabled && styles.innerCircleDisabled,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: OUTER_SIZE,
    height: OUTER_SIZE,
    borderRadius: OUTER_SIZE / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  outerRingDisabled: {
    borderColor: colors.textTertiary,
  },
  innerCircle: {
    width: INNER_SIZE - BORDER_WIDTH * 2,
    height: INNER_SIZE - BORDER_WIDTH * 2,
    borderRadius: (INNER_SIZE - BORDER_WIDTH * 2) / 2,
    backgroundColor: '#FFFFFF',
  } as ViewStyle,
  innerCircleDisabled: {
    backgroundColor: colors.textTertiary,
  },
});
