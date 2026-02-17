/**
 * Permission request helpers for camera and media library.
 *
 * Wraps expo-image-picker permission APIs with a consistent
 * {granted, canAskAgain} return shape and optional user-facing alerts.
 */
import { Linking, Platform } from 'react-native';
import { showAlert } from './alert';
import * as ImagePicker from 'expo-image-picker';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

// ── Camera ──────────────────────────────────────────────────────────────

export async function requestCameraPermission(
  showAlertOnDenied = true,
): Promise<PermissionResult> {
  // On web, camera permission is handled by the browser's getUserMedia prompt
  if (Platform.OS === 'web') {
    return { granted: true, canAskAgain: true };
  }

  const { status, canAskAgain } =
    await ImagePicker.requestCameraPermissionsAsync();

  const granted = status === 'granted';

  if (!granted && showAlertOnDenied) {
    showPermissionDeniedAlert(
      'Camera Access Required',
      'SpotIt needs camera access to scan and catalog your items. Please enable it in Settings.',
    );
  }

  return { granted, canAskAgain };
}

// ── Media Library / Photo Library ───────────────────────────────────────

export async function requestMediaLibraryPermission(
  showAlertOnDenied = true,
): Promise<PermissionResult> {
  // On web, media library access is handled by browser file picker
  if (Platform.OS === 'web') {
    return { granted: true, canAskAgain: true };
  }

  const { status, canAskAgain } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  const granted = status === 'granted';

  if (!granted && showAlertOnDenied) {
    showPermissionDeniedAlert(
      'Photo Library Access Required',
      'SpotIt needs photo library access to save scanned images. Please enable it in Settings.',
    );
  }

  return { granted, canAskAgain };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function showPermissionDeniedAlert(title: string, message: string): void {
  showAlert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Open Settings',
      onPress: () => {
        if (Platform.OS === 'ios') {
          Linking.openURL('app-settings:');
        } else {
          Linking.openSettings();
        }
      },
    },
  ]);
}
