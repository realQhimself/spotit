/**
 * Web implementation of useObjectDetection hook.
 * Uses ONNX Runtime Web loaded from CDN to run YOLOv11n inference
 * in the browser via WASM backend.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { parseYoloOutput, nonMaxSuppression } from './yoloPostProcess';
import { COCO_CLASSES } from './cocoClasses';
import { SCAN } from '../utils/constants';
import type { Detection } from '../types/detection';

const MODEL_INPUT_SIZE = 640;
const CONFIDENCE_THRESHOLD = SCAN.CONFIDENCE_THRESHOLD;
const IOU_THRESHOLD = SCAN.NMS_IOU_THRESHOLD;

// ── Types ────────────────────────────────────────────────────────────────

export type { Detection };
export type ModelState = 'idle' | 'loading' | 'ready' | 'error';

interface UseObjectDetectionResult {
  detections: Detection[];
  modelState: ModelState;
  videoRef: React.RefObject<HTMLVideoElement>;
  startDetection: () => void;
  stopDetection: () => void;
}

// ── CDN loading ──────────────────────────────────────────────────────────

const ORT_VERSION = '1.21.0';
const ORT_CDN_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const ORT_CDN_URL = `${ORT_CDN_BASE}ort.min.js`;

let ortLoadPromise: Promise<any> | null = null;

function loadOrt(): Promise<any> {
  if ((window as any).ort) {
    (window as any).ort.env.wasm.wasmPaths = ORT_CDN_BASE;
    return Promise.resolve((window as any).ort);
  }
  if (ortLoadPromise) return ortLoadPromise;

  ortLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ORT_CDN_URL;
    script.onload = () => {
      const ortLib = (window as any).ort;
      if (ortLib) {
        ortLib.env.wasm.wasmPaths = ORT_CDN_BASE;
        resolve(ortLib);
      } else {
        reject(new Error('ONNX Runtime loaded but ort global not found'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load ONNX Runtime from CDN'));
    document.head.appendChild(script);
  });

  return ortLoadPromise;
}

// ── Preprocessing ────────────────────────────────────────────────────────

function rgbaToChwFloat32(rgba: Uint8ClampedArray, w: number, h: number): Float32Array {
  const chw = new Float32Array(3 * w * h);
  for (let i = 0; i < w * h; i++) {
    chw[i] = rgba[i * 4] / 255;              // R channel
    chw[w * h + i] = rgba[i * 4 + 1] / 255;  // G channel
    chw[2 * w * h + i] = rgba[i * 4 + 2] / 255; // B channel
  }
  return chw;
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useObjectDetection(): UseObjectDetectionResult {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [modelState, setModelState] = useState<ModelState>('idle');

  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runningRef = useRef(false);
  const rafRef = useRef<number>(0);
  const lastInferenceRef = useRef(0);

  // Load model on mount
  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        setModelState('loading');
        const ortLib = await loadOrt();

        // Determine model URL based on environment
        // Try Expo's base URL, then fall back to checking pathname for GitHub Pages
        let baseUrl = (window as any).__EXPO_BASE_URL || '';
        if (!baseUrl) {
          // On GitHub Pages, detect /spotit/ base path
          const path = window.location.pathname;
          const match = path.match(/^(\/[^/]+)\//);
          if (match) baseUrl = match[1];
        }
        const modelUrl = `${baseUrl}/models/yolov11n.onnx`;

        const session = await ortLib.InferenceSession.create(modelUrl, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });

        if (!cancelled) {
          sessionRef.current = session;
          setModelState('ready');
        }
      } catch (err) {
        console.error('Failed to load ONNX model:', err);
        if (!cancelled) {
          setModelState('error');
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const runInference = useCallback(async () => {
    if (!runningRef.current || !sessionRef.current || !videoRef.current) return;

    const now = performance.now();
    // Throttle to ~8fps to prevent overwhelming the browser
    if (now - lastInferenceRef.current < 125) {
      rafRef.current = requestAnimationFrame(runInference);
      return;
    }
    lastInferenceRef.current = now;

    try {
      const video = videoRef.current;
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(runInference);
        return;
      }

      // Create offscreen canvas for preprocessing
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = MODEL_INPUT_SIZE;
        canvasRef.current.height = MODEL_INPUT_SIZE;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
      const imageData = ctx.getImageData(0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

      // RGBA -> CHW Float32 (ONNX uses NCHW format)
      const chwData = rgbaToChwFloat32(imageData.data, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);

      // Create tensor and run inference
      const ortLib = (window as any).ort;
      const tensor = new ortLib.Tensor('float32', chwData, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
      const results = await sessionRef.current.run({ images: tensor });

      // Get output - YOLOv11 outputs shape [1, 84, 8400]
      const outputKey = Object.keys(results)[0];
      const output = results[outputKey];
      const outputData = output.data instanceof Float32Array
        ? output.data
        : new Float32Array(output.data as ArrayBuffer);

      // Use existing post-processing
      const rawDetections = parseYoloOutput(outputData, 80, CONFIDENCE_THRESHOLD);
      const nmsDetections = nonMaxSuppression(rawDetections, IOU_THRESHOLD);

      // Convert to Detection format
      const newDetections: Detection[] = nmsDetections.map((d, idx) => ({
        id: `det-${Date.now()}-${idx}`,
        className: COCO_CLASSES[d.classId] || `class_${d.classId}`,
        classId: d.classId,
        confidence: d.confidence,
        bbox: {
          x: d.x - d.w / 2,
          y: d.y - d.h / 2,
          width: d.w,
          height: d.h,
        },
      }));

      setDetections(newDetections);
    } catch (err) {
      // Silently handle errors during inference - don't crash the loop
      // Common causes: tab backgrounded, session disposed, video paused
      if (runningRef.current) {
        console.warn('Inference frame skipped:', (err as Error)?.message);
      }
    }

    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(runInference);
    }
  }, []);

  // Pause inference when tab is backgrounded (prevents crashes on mobile)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && runningRef.current) {
        runningRef.current = false;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      } else if (!document.hidden && sessionRef.current && !runningRef.current) {
        runningRef.current = true;
        rafRef.current = requestAnimationFrame(runInference);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [runInference]);

  const startDetection = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    rafRef.current = requestAnimationFrame(runInference);
  }, [runInference]);

  const stopDetection = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    setDetections([]);
  }, []);

  return {
    detections,
    modelState,
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    startDetection,
    stopDetection,
  };
}
