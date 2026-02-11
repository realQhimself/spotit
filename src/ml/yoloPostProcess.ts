/**
 * Post-processing utilities for YOLOv11 model output.
 *
 * YOLOv11 outputs a tensor of shape [1, 84, 8400] where:
 *   - 84 = 4 bounding-box values (cx, cy, w, h) + 80 COCO class scores
 *   - 8400 = number of candidate detections (grid cells x anchors)
 *
 * The tensor is *transposed* compared to older YOLO versions, meaning the
 * 8400 candidates are laid out across columns while the 84 values per
 * candidate are laid out across rows.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface RawDetection {
  classId: number;
  confidence: number;
  /** Center x (normalised 0-1 or pixel depending on model) */
  x: number;
  /** Center y */
  y: number;
  /** Width */
  w: number;
  /** Height */
  h: number;
}

// ── Parse raw model output ─────────────────────────────────────────────

/**
 * Parse the raw Float32Array output of a YOLOv11 model into detections.
 *
 * @param rawOutput   Flat Float32Array of length 1 * 84 * 8400 = 705,600.
 * @param numClasses  Number of classes the model was trained on (default 80).
 * @param confidenceThreshold  Minimum class score to keep a candidate.
 * @returns Array of detections that passed the confidence filter.
 */
export function parseYoloOutput(
  rawOutput: Float32Array,
  numClasses: number = 80,
  confidenceThreshold: number = 0.4,
): RawDetection[] {
  const numCandidates = 8400;
  const rowLength = 4 + numClasses; // 84 for COCO

  const detections: RawDetection[] = [];

  // The tensor is shaped [1, 84, 8400] stored row-major.
  // Row i, column j  =>  rawOutput[i * 8400 + j]
  //
  // For candidate j:
  //   cx = rawOutput[0 * 8400 + j]
  //   cy = rawOutput[1 * 8400 + j]
  //   w  = rawOutput[2 * 8400 + j]
  //   h  = rawOutput[3 * 8400 + j]
  //   class_k_score = rawOutput[(4 + k) * 8400 + j]

  for (let j = 0; j < numCandidates; j++) {
    // Bounding box (center format)
    const cx = rawOutput[0 * numCandidates + j];
    const cy = rawOutput[1 * numCandidates + j];
    const bw = rawOutput[2 * numCandidates + j];
    const bh = rawOutput[3 * numCandidates + j];

    // Find the class with the highest score
    let maxScore = -Infinity;
    let maxClassId = 0;

    for (let k = 0; k < numClasses; k++) {
      const score = rawOutput[(4 + k) * numCandidates + j];
      if (score > maxScore) {
        maxScore = score;
        maxClassId = k;
      }
    }

    if (maxScore >= confidenceThreshold) {
      detections.push({
        classId: maxClassId,
        confidence: maxScore,
        x: cx,
        y: cy,
        w: bw,
        h: bh,
      });
    }
  }

  return detections;
}

// ── IoU calculation ────────────────────────────────────────────────────

/**
 * Compute Intersection over Union for two bounding boxes in center format
 * (x, y, w, h) where x/y is the center.
 */
export function calculateIoU(a: RawDetection, b: RawDetection): number {
  // Convert center format to corner format (x1, y1, x2, y2)
  const ax1 = a.x - a.w / 2;
  const ay1 = a.y - a.h / 2;
  const ax2 = a.x + a.w / 2;
  const ay2 = a.y + a.h / 2;

  const bx1 = b.x - b.w / 2;
  const by1 = b.y - b.h / 2;
  const bx2 = b.x + b.w / 2;
  const by2 = b.y + b.h / 2;

  // Intersection rectangle
  const interX1 = Math.max(ax1, bx1);
  const interY1 = Math.max(ay1, by1);
  const interX2 = Math.min(ax2, bx2);
  const interY2 = Math.min(ay2, by2);

  const interWidth = Math.max(0, interX2 - interX1);
  const interHeight = Math.max(0, interY2 - interY1);
  const interArea = interWidth * interHeight;

  // Union
  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  const unionArea = areaA + areaB - interArea;

  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

// ── Non-maximum suppression ────────────────────────────────────────────

/**
 * Greedy non-maximum suppression.
 *
 * 1. Sort detections by confidence (descending).
 * 2. Iterate: keep the current detection, discard any remaining detection
 *    whose IoU with it exceeds the threshold.
 *
 * @param detections  Candidate detections (already filtered by confidence).
 * @param iouThreshold  Overlap threshold above which a detection is suppressed.
 * @returns Filtered list of detections.
 */
export function nonMaxSuppression(
  detections: RawDetection[],
  iouThreshold: number = 0.45,
): RawDetection[] {
  // Sort by confidence descending
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);

  const kept: RawDetection[] = [];
  const suppressed = new Set<number>();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;

    kept.push(sorted[i]);

    // Suppress lower-confidence detections that overlap too much
    for (let j = i + 1; j < sorted.length; j++) {
      if (suppressed.has(j)) continue;

      if (calculateIoU(sorted[i], sorted[j]) > iouThreshold) {
        suppressed.add(j);
      }
    }
  }

  return kept;
}
