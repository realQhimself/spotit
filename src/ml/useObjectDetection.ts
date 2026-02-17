/**
 * Hook for real-time object detection using YOLOv11 + VisionCamera frame processor.
 *
 * ## Pipeline overview
 *
 * 1. **Model loading** — useTensorflowModel loads the YOLOv11n TFLite model
 *    from the app bundle at startup. The model state transitions through
 *    'loading' -> 'ready' | 'error'.
 *
 * 2. **Frame processor** — useFrameProcessor creates a worklet that runs on
 *    every camera frame (30 fps). Inside the worklet:
 *      a. The camera frame (YUV/RGB) is resized to the model's input size
 *         (e.g. 640x640) by the TFLite delegate.
 *      b. The model runs inference and returns raw output [1, 84, 8400].
 *      c. parseYoloOutput extracts candidates above the confidence threshold.
 *      d. nonMaxSuppression removes overlapping boxes.
 *      e. Results are written to a shared value so the JS thread can read
 *         them without blocking the camera.
 *
 * 3. **Shared value** — detections are stored in a Reanimated shared value
 *    (useSharedValue) so both the UI thread (for drawing overlays) and the
 *    JS thread (for state updates) can access them efficiently.
 */

import React, { useEffect, useState } from 'react';
import { SCAN } from '../utils/constants';
import { COCO_CLASSES } from './cocoClasses';
import { parseYoloOutput, nonMaxSuppression } from './yoloPostProcess';
import type { RawDetection } from './yoloPostProcess';
import type { Detection } from '../types/detection';

// ─── Native imports ─────────────────────────────────────────────────────
import { useFrameProcessor } from 'react-native-vision-camera';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { useSharedValue } from 'react-native-reanimated';
import { useRunOnJS } from 'react-native-worklets-core';

// ── Types ──────────────────────────────────────────────────────────────

export type ModelState = 'idle' | 'loading' | 'ready' | 'error';

export interface UseObjectDetectionResult {
  /** VisionCamera frame processor — pass this to <Camera frameProcessor={...} /> */
  frameProcessor: ReturnType<typeof useFrameProcessor>;
  /** Current detections visible on screen */
  detections: Detection[];
  /** Lifecycle state of the TFLite model */
  modelState: ModelState;
  /** Web-only: ref to attach to a <video> element */
  videoRef?: React.RefObject<HTMLVideoElement>;
  /** Web-only: start the detection loop */
  startDetection?: () => void;
  /** Web-only: stop the detection loop */
  stopDetection?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────

/** Unique ID counter for detections within a session. */
let detectionIdCounter = 0;

function rawToDetection(raw: RawDetection): Detection {
  return {
    id: `det_${Date.now()}_${detectionIdCounter++}`,
    classId: raw.classId,
    className: COCO_CLASSES[raw.classId] ?? `class_${raw.classId}`,
    confidence: raw.confidence,
    bbox: {
      x: raw.x - raw.w / 2,
      y: raw.y - raw.h / 2,
      width: raw.w,
      height: raw.h,
    },
  };
}

// ── Hook ───────────────────────────────────────────────────────────────

/**
 * Real-time object detection hook.
 *
 * Usage:
 * ```tsx
 * const { frameProcessor, detections, modelState } = useObjectDetection();
 *
 * return (
 *   <Camera
 *     frameProcessor={frameProcessor}
 *     device={device}
 *     isActive={true}
 *   />
 * );
 * ```
 */
export function useObjectDetection(): UseObjectDetectionResult {
  const [modelState, setModelState] = useState<ModelState>('idle');
  const [detections, setDetections] = useState<Detection[]>([]);
  const lastProcessTimeRef = useSharedValue<number>(0);

  // ── Model loading ──────────────────────────────────────────────────
  const model = useTensorflowModel(
    require('../../assets/models/yolov11n.tflite'),
    'android-gpu', // or 'core-ml' on iOS
  );

  useEffect(() => {
    if (model.state === 'loading') setModelState('loading');
    if (model.state === 'loaded') setModelState('ready');
    if (model.state === 'error') setModelState('error');
  }, [model.state]);

  // ── Frame processor ────────────────────────────────────────────────
  //
  // The frame processor runs on the camera thread (worklet). We:
  //   1. Throttle to ~10 fps (every 100ms) to avoid overloading the GPU.
  //   2. Run the model on the frame.
  //   3. Post-process the output with parseYoloOutput + nonMaxSuppression.
  //   4. Bridge results back to JS with useRunOnJS.
  //
  // @ts-expect-error useRunOnJS signature varies between worklets-core versions
  const updateDetectionsJS = useRunOnJS((rawDets: RawDetection[]) => {
    setDetections(rawDets.map(rawToDetection));
  });

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      // Throttle inference to ~10 fps
      const now = performance.now();
      if (now - lastProcessTimeRef.value < 100) return;
      lastProcessTimeRef.value = now;

      // Run inference — model.runSync resizes the frame internally
      // @ts-expect-error Frame type mismatch between vision-camera and fast-tflite versions
      const output = model.model?.runSync([frame]);
      if (!output || !output[0]) return;

      // Post-process: shape is [1, 84, 8400]
      // @ts-expect-error TypedArray from TFLite is compatible with Float32Array constructor
      const rawOutput = new Float32Array(output[0]);
      const candidates = parseYoloOutput(
        rawOutput,
        80,
        SCAN.CONFIDENCE_THRESHOLD,
      );
      const filtered = nonMaxSuppression(candidates, SCAN.NMS_IOU_THRESHOLD);

      // Cap detections and send to JS thread
      const capped = filtered.slice(0, SCAN.MAX_DETECTIONS);
      updateDetectionsJS(capped);
    },
    [model],
  );

  return {
    frameProcessor,
    detections,
    modelState,
  };
}
