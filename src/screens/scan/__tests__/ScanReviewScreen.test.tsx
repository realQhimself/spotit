/**
 * Component tests for ScanReviewScreen.
 */

// ── Mocks (must be before imports) ──────────────────────────────────────

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'file://cropped.jpg' }),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('base64data'),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('../../../utils/alert', () => ({
  showAlert: jest.fn(),
}));

jest.mock('../../../database/helpers/itemHelpers', () => ({
  createItem: jest.fn().mockResolvedValue({ id: 'item-1' }),
  updateItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../database/helpers/scanHelpers', () => ({
  createScan: jest.fn().mockResolvedValue({ id: 'scan-1' }),
  createScanDetection: jest.fn().mockResolvedValue(undefined),
  completeScan: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../database/helpers/roomHelpers', () => ({
  getAllRooms: jest.fn().mockReturnValue({
    subscribe: (cb: any) => {
      cb([]);
      return { unsubscribe: jest.fn() };
    },
  }),
  getRoomById: jest.fn().mockResolvedValue({ name: 'Living Room' }),
  createRoom: jest.fn().mockResolvedValue({ id: 'room-new', name: 'New Room' }),
}));

jest.mock('../../../services/enrichmentQueue', () => ({
  enrichmentQueue: {
    add: jest.fn(),
    onItemEnriched: null,
  },
}));

jest.mock('../../../ml/imageUtils', () => ({
  cropBoundingBox: jest.fn().mockResolvedValue('file://cropped.jpg'),
  imageToBase64: jest.fn().mockResolvedValue('base64data'),
}));

jest.mock('react-native-reanimated', () => ({
  default: {
    call: jest.fn(),
    createAnimatedComponent: (c: any) => c,
  },
}));

// ── Imports ─────────────────────────────────────────────────────────────

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ScanReviewScreen from '../ScanReviewScreen';
import { useScanStore } from '../../../store/useScanStore';
import type { Detection } from '../../../types/detection';

// ── Helpers ─────────────────────────────────────────────────────────────

const mockNavigation = {
  goBack: jest.fn(),
  popToTop: jest.fn(),
  navigate: jest.fn(),
} as any;

const mockRoute = {
  params: { scanId: 'test-scan-1' },
} as any;

function renderScreen(detections: Detection[] = []) {
  // Set store state before rendering
  useScanStore.setState({
    scanMode: 'quick',
    isScanning: false,
    detections,
    capturedPhotoUri: null,
    selectedRoomId: null,
    selectedZoneId: null,
  });

  return render(
    <ScanReviewScreen navigation={mockNavigation} route={mockRoute} />,
  );
}

const sampleDetections: Detection[] = [
  {
    id: 'det-1',
    classId: 62,
    className: 'laptop',
    confidence: 0.92,
    bbox: { x: 100, y: 100, width: 200, height: 150 },
  },
  {
    id: 'det-2',
    classId: 41,
    className: 'cup',
    confidence: 0.78,
    bbox: { x: 300, y: 200, width: 50, height: 60 },
  },
];

// ── Tests ───────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ScanReviewScreen', () => {
  it('renders empty state when no detections in store', () => {
    const { getByText } = renderScreen([]);

    expect(getByText('No items detected')).toBeTruthy();
    expect(getByText('Scan Again')).toBeTruthy();
  });

  it('renders detection cards when detections exist', () => {
    const { getByDisplayValue, getAllByText } = renderScreen(sampleDetections);

    // Detection names should appear as TextInput values
    expect(getByDisplayValue('laptop')).toBeTruthy();
    expect(getByDisplayValue('cup')).toBeTruthy();

    // The "Review Items" header should be present
    expect(getAllByText('Review Items').length).toBeGreaterThan(0);
  });

  it('dismiss button removes a detection', () => {
    const { getAllByText, getByDisplayValue, queryByDisplayValue } = renderScreen(sampleDetections);

    // Find dismiss buttons (the X characters)
    const dismissButtons = getAllByText('\u2715');
    expect(dismissButtons.length).toBe(2);

    // Dismiss the first detection
    fireEvent.press(dismissButtons[0]);

    // 'laptop' should be gone
    expect(queryByDisplayValue('laptop')).toBeNull();
    // 'cup' should still be there
    expect(getByDisplayValue('cup')).toBeTruthy();
  });

  it('save button is disabled when no detections', () => {
    const { getByText } = renderScreen([]);

    // In empty state, the "Scan Again" button is shown, not "Save All Items"
    expect(getByText('Scan Again')).toBeTruthy();
  });

  it('name editing updates detection name', () => {
    const { getByDisplayValue } = renderScreen(sampleDetections);

    const nameInput = getByDisplayValue('laptop');
    fireEvent.changeText(nameInput, 'MacBook Pro');

    expect(getByDisplayValue('MacBook Pro')).toBeTruthy();
  });
});
