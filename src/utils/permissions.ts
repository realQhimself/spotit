/**
 * Permission request helpers for camera and media library.
 *
 * Wraps expo-image-picker permission APIs with a consistent
 * {granted, canAskAgain} return shape and optional user-facing alerts.
 */
import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

// ── Camera ──────────────────────────────────────────────────────────────

export async function requestCameraPermission(
  showAlert = true,
): Promise<PermissionResult> {
  const { status, canAskAgain } =
    await ImagePicker.requestCameraPermissionsAsync();

  const granted = status === 'granted';

  if (!granted && showAlert) {
    showPermissionDeniedAlert(
      'Camera Access Required',
      'SpotIt needs camera access to scan and catalog your items. Please enable it in Settings.',
    );
  }

  return { granted, canAskAgain };
}

// ── Media Library / Photo Library ───────────────────────────────────────

export async function requestMediaLibraryPermission(
  showAlert = true,
): Promise<PermissionResult> {
  const { status, canAskAgain } =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  const granted = status === 'granted';

  if (!granted && showAlert) {
    showPermissionDeniedAlert(
      'Photo Library Access Required',
      'SpotIt needs photo library access to save scanned images. Please enable it in Settings.',
    );
  }

  return { granted, canAskAgain };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function showPermissionDeniedAlert(title: string, message: string): void {
  Alert.alert(title, message, [
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
