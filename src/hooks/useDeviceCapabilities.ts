/**
 * Hook that detects device hardware capabilities relevant to SpotIt.
 *
 * Returns booleans for camera availability, LiDAR sensor presence, and
 * current network connectivity.
 */

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// ── Types ──────────────────────────────────────────────────────────────

export interface DeviceCapabilities {
  /** Whether the device has a usable camera (assumed true on physical devices). */
  hasCamera: boolean;
  /** Whether the device has a LiDAR scanner (select iPad Pro / iPhone Pro models). */
  hasLiDAR: boolean;
  /** Whether the device currently has network connectivity. */
  isOnline: boolean;
}

// ── LiDAR detection helper ─────────────────────────────────────────────

/**
 * Best-effort LiDAR detection.
 *
 * On iOS we can check the device model string from Platform.constants.
 * LiDAR is available on:
 *   - iPhone 12 Pro and later Pro/Pro Max models
 *   - iPad Pro (2020 and later)
 *
 * Since React Native's Platform.constants doesn't reliably expose the
 * marketing model name, this is a simple heuristic. For a production app
 * you'd use a native module or react-native-device-info.
 */
function detectLiDAR(): boolean {
  if (Platform.OS !== 'ios') return false;

  // Platform.constants on iOS may contain `systemName`, `osVersion`, etc.
  // A definitive check requires native code; for now we use a conservative
  // flag that can be overridden at runtime.
  //
  // TODO: Implement proper LiDAR detection via native ARKit session check
  // (ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh))
  return false;
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useDeviceCapabilities(): DeviceCapabilities {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return {
    // Assume camera is available on physical devices; simulators may not have one.
    // A more robust check: use Camera.getAvailableCameraDevices() from vision-camera.
    hasCamera: Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web',
    hasLiDAR: detectLiDAR(),
    isOnline,
  };
}
