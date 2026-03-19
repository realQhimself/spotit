/**
 * Tests for image utility functions.
 *
 * expo-image-manipulator and expo-file-system are mocked since they require
 * native bridges that are not available in the test environment.
 */

// ── Mocks (must be before imports) ──────────────────────────────────────

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// ── Imports ─────────────────────────────────────────────────────────────

import { cropBoundingBox, resizeImage, imageToBase64 } from '../imageUtils';
import { manipulateAsync } from 'expo-image-manipulator';
import { readAsStringAsync } from 'expo-file-system/legacy';

const mockManipulateAsync = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;
const mockReadAsStringAsync = readAsStringAsync as jest.MockedFunction<typeof readAsStringAsync>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ── cropBoundingBox ─────────────────────────────────────────────────────

describe('cropBoundingBox', () => {
  it('clamps coordinates to image bounds', async () => {
    mockManipulateAsync.mockResolvedValue({ uri: 'file://cropped.jpg' } as any);

    // bbox partially outside image: x=-10 should clamp to 0
    await cropBoundingBox(
      'file://test.jpg',
      { x: -10, y: -5, width: 100, height: 80 },
      200,
      200,
    );

    expect(mockManipulateAsync).toHaveBeenCalledTimes(1);
    const callArgs = mockManipulateAsync.mock.calls[0];
    const cropAction = (callArgs[1] as any[])[0].crop;
    // Negative coords should be clamped to 0
    expect(cropAction.originX).toBe(0);
    expect(cropAction.originY).toBe(0);
  });

  it('returns original URI when bbox produces invalid (zero) dimensions', async () => {
    // Width that exceeds image width from the clamped position results in <=0 effective width
    const result = await cropBoundingBox(
      'file://test.jpg',
      { x: 250, y: 10, width: 100, height: 50 },
      200, // imageWidth is 200 but x=250 > 200 => clampedX=200 => clampedW = min(100, 200-200) = 0
      200,
    );

    expect(result).toBe('file://test.jpg');
    expect(mockManipulateAsync).not.toHaveBeenCalled();
  });

  it('returns original URI on manipulateAsync failure', async () => {
    mockManipulateAsync.mockRejectedValue(new Error('Native module error'));

    const result = await cropBoundingBox(
      'file://test.jpg',
      { x: 10, y: 10, width: 50, height: 50 },
      200,
      200,
    );

    expect(result).toBe('file://test.jpg');
  });
});

// ── resizeImage ─────────────────────────────────────────────────────────

describe('resizeImage', () => {
  it('calls manipulateAsync with correct resize params', async () => {
    mockManipulateAsync.mockResolvedValue({ uri: 'file://resized.jpg' } as any);

    const result = await resizeImage('file://original.jpg', 640, 0.8);

    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'file://original.jpg',
      [{ resize: { width: 640 } }],
      { format: 'jpeg', compress: 0.8 },
    );
    expect(result).toBe('file://resized.jpg');
  });

  it('returns original URI on failure', async () => {
    mockManipulateAsync.mockRejectedValue(new Error('fail'));

    const result = await resizeImage('file://original.jpg');
    expect(result).toBe('file://original.jpg');
  });
});

// ── imageToBase64 ───────────────────────────────────────────────────────

describe('imageToBase64', () => {
  it('calls readAsStringAsync with Base64 encoding', async () => {
    mockReadAsStringAsync.mockResolvedValue('aGVsbG8=');

    const result = await imageToBase64('file://photo.jpg');

    expect(mockReadAsStringAsync).toHaveBeenCalledWith('file://photo.jpg', {
      encoding: 'base64',
    });
    expect(result).toBe('aGVsbG8=');
  });
});
