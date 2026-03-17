/**
 * Image utility functions for the SpotIt detection and enrichment pipeline.
 */

import {
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';

// ── Types ──────────────────────────────────────────────────────────────

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Crop bounding box ──────────────────────────────────────────────────

/**
 * Crop a bounding box region from an image.
 *
 * TODO: Implement native image cropping using either:
 *   - expo-image-manipulator (Actions.crop)
 *   - react-native-image-crop-picker
 *   - A custom Skia-based crop with @shopify/react-native-skia
 *
 * @param imageUri     URI of the source image (file:// or content://).
 * @param bbox         Bounding box to crop (in pixel coordinates).
 * @param imageWidth   Full width of the source image in pixels.
 * @param imageHeight  Full height of the source image in pixels.
 * @returns Promise resolving to a file URI of the cropped image.
 */
export async function cropBoundingBox(
  imageUri: string,
  bbox: CropRect,
  imageWidth: number,
  imageHeight: number,
): Promise<string> {
  // TODO: Implement actual cropping once image manipulation library is chosen.
  //
  // Example with expo-image-manipulator:
  //
  // import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
  //
  // const clampedX = Math.max(0, Math.round(bbox.x));
  // const clampedY = Math.max(0, Math.round(bbox.y));
  // const clampedW = Math.min(Math.round(bbox.width), imageWidth - clampedX);
  // const clampedH = Math.min(Math.round(bbox.height), imageHeight - clampedY);
  //
  // const result = await manipulateAsync(
  //   imageUri,
  //   [{ crop: { originX: clampedX, originY: clampedY, width: clampedW, height: clampedH } }],
  //   { format: SaveFormat.JPEG, compress: 0.85 },
  // );
  // return result.uri;

  console.warn('[imageUtils] cropBoundingBox is not yet implemented — returning original URI');
  return imageUri;
}

// ── Resize image ───────────────────────────────────────────────────────

/**
 * Resize an image to a maximum width while preserving aspect ratio.
 *
 * TODO: Implement using expo-image-manipulator or similar.
 *
 * @param uri       URI of the source image.
 * @param maxWidth  Maximum width in pixels (height will scale proportionally).
 * @param quality   JPEG compression quality 0-1 (default 0.8).
 * @returns Promise resolving to a file URI of the resized image.
 */
export async function resizeImage(
  uri: string,
  maxWidth: number = 640,
  quality: number = 0.8,
): Promise<string> {
  // TODO: Implement actual resizing.
  //
  // Example with expo-image-manipulator:
  //
  // import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
  //
  // const result = await manipulateAsync(
  //   uri,
  //   [{ resize: { width: maxWidth } }],
  //   { format: SaveFormat.JPEG, compress: quality },
  // );
  // return result.uri;

  console.warn('[imageUtils] resizeImage is not yet implemented — returning original URI');
  return uri;
}

// ── Image to base64 ───────────────────────────────────────────────────

/**
 * Read an image file and return its contents as a base64-encoded string.
 *
 * Uses expo-file-system which is already installed.
 *
 * @param uri  Local file URI of the image.
 * @returns Base64 string of the image data.
 */
export async function imageToBase64(uri: string): Promise<string> {
  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  });
  return base64;
}
