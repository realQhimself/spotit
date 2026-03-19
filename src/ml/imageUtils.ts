/**
 * Image utility functions for the SpotIt detection and enrichment pipeline.
 */

import {
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

// ── Types ──────────────────────────────────────────────────────────────

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Web canvas crop fallback ──────────────────────────────────────────

/**
 * Crop a data: URI image using an offscreen canvas (web only).
 * expo-image-manipulator may not support data: URIs, so we use canvas directly.
 */
async function cropWithCanvas(
  dataUri: string,
  originX: number,
  originY: number,
  width: number,
  height: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context'));
        return;
      }
      ctx.drawImage(img, originX, originY, width, height, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image for canvas crop'));
    img.src = dataUri;
  });
}

// ── Crop bounding box ──────────────────────────────────────────────────

/**
 * Crop a bounding box region from an image.
 *
 * Uses expo-image-manipulator for native platforms and a canvas fallback
 * for web data: URIs that expo-image-manipulator cannot handle.
 *
 * @param imageUri     URI of the source image (file://, content://, or data:).
 * @param bbox         Bounding box to crop (in pixel coordinates).
 * @param imageWidth   Full width of the source image in pixels.
 * @param imageHeight  Full height of the source image in pixels.
 * @returns Promise resolving to a URI of the cropped image.
 */
export async function cropBoundingBox(
  imageUri: string,
  bbox: CropRect,
  imageWidth: number,
  imageHeight: number,
): Promise<string> {
  try {
    // Clamp bbox to image bounds
    const clampedX = Math.max(0, Math.round(bbox.x));
    const clampedY = Math.max(0, Math.round(bbox.y));
    const clampedW = Math.min(Math.round(bbox.width), imageWidth - clampedX);
    const clampedH = Math.min(Math.round(bbox.height), imageHeight - clampedY);

    // Sanity check: don't crop if the region is invalid
    if (clampedW <= 0 || clampedH <= 0) {
      return imageUri;
    }

    // Web data: URIs need canvas fallback since expo-image-manipulator
    // may not handle them
    if (Platform.OS === 'web' && imageUri.startsWith('data:')) {
      return await cropWithCanvas(imageUri, clampedX, clampedY, clampedW, clampedH);
    }

    const result = await manipulateAsync(
      imageUri,
      [{ crop: { originX: clampedX, originY: clampedY, width: clampedW, height: clampedH } }],
      { format: SaveFormat.JPEG, compress: 0.85 },
    );
    return result.uri;
  } catch (err) {
    console.warn('[imageUtils] cropBoundingBox failed, returning original URI:', err);
    return imageUri;
  }
}

// ── Resize image ───────────────────────────────────────────────────────

/**
 * Resize an image to a maximum width while preserving aspect ratio.
 *
 * @param uri       URI of the source image.
 * @param maxWidth  Maximum width in pixels (height will scale proportionally).
 * @param quality   JPEG compression quality 0-1 (default 0.8).
 * @returns Promise resolving to a URI of the resized image.
 */
export async function resizeImage(
  uri: string,
  maxWidth: number = 640,
  quality: number = 0.8,
): Promise<string> {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { format: SaveFormat.JPEG, compress: quality },
    );
    return result.uri;
  } catch (err) {
    console.warn('[imageUtils] resizeImage failed, returning original URI:', err);
    return uri;
  }
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
