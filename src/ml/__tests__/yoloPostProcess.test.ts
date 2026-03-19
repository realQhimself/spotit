import {
  parseYoloOutput,
  nonMaxSuppression,
  calculateIoU,
  RawDetection,
} from '../yoloPostProcess';

// ── Helper: build a minimal YOLO tensor ─────────────────────────────────
// Shape [1, 84, 8400] stored row-major  =>  705,600 floats.
// Row i, column j  =>  data[i * 8400 + j]

const NUM_CANDIDATES = 8400;
const NUM_CLASSES = 80;
const ROW_LENGTH = 4 + NUM_CLASSES; // 84

/**
 * Build a Float32Array that mimics one detection at a given candidate slot
 * with the specified bbox and class score.
 */
function buildTensor(
  entries: Array<{
    candidateIndex: number;
    cx: number;
    cy: number;
    w: number;
    h: number;
    classId: number;
    score: number;
  }>,
): Float32Array {
  const data = new Float32Array(ROW_LENGTH * NUM_CANDIDATES);
  for (const e of entries) {
    const j = e.candidateIndex;
    data[0 * NUM_CANDIDATES + j] = e.cx;
    data[1 * NUM_CANDIDATES + j] = e.cy;
    data[2 * NUM_CANDIDATES + j] = e.w;
    data[3 * NUM_CANDIDATES + j] = e.h;
    data[(4 + e.classId) * NUM_CANDIDATES + j] = e.score;
  }
  return data;
}

// ── parseYoloOutput ─────────────────────────────────────────────────────

describe('parseYoloOutput', () => {
  it('returns empty array when no candidates exceed threshold', () => {
    // All zeros — no scores above any positive threshold
    const tensor = new Float32Array(ROW_LENGTH * NUM_CANDIDATES);
    const result = parseYoloOutput(tensor, NUM_CLASSES, 0.4);
    expect(result).toEqual([]);
  });

  it('correctly parses detections from mock tensor data', () => {
    const tensor = buildTensor([
      {
        candidateIndex: 0,
        cx: 100,
        cy: 200,
        w: 50,
        h: 60,
        classId: 5,
        score: 0.9,
      },
      {
        candidateIndex: 100,
        cx: 300,
        cy: 400,
        w: 80,
        h: 90,
        classId: 10,
        score: 0.7,
      },
    ]);

    const result = parseYoloOutput(tensor, NUM_CLASSES, 0.4);
    expect(result).toHaveLength(2);

    expect(result[0].classId).toBe(5);
    expect(result[0].confidence).toBeCloseTo(0.9, 5);
    expect(result[0].x).toBeCloseTo(100);
    expect(result[0].y).toBeCloseTo(200);
    expect(result[0].w).toBeCloseTo(50);
    expect(result[0].h).toBeCloseTo(60);

    expect(result[1].classId).toBe(10);
    expect(result[1].confidence).toBeCloseTo(0.7, 5);
    expect(result[1].x).toBeCloseTo(300);
    expect(result[1].y).toBeCloseTo(400);
    expect(result[1].w).toBeCloseTo(80);
    expect(result[1].h).toBeCloseTo(90);
  });

  it('respects confidence threshold parameter', () => {
    const tensor = buildTensor([
      { candidateIndex: 0, cx: 10, cy: 10, w: 10, h: 10, classId: 0, score: 0.3 },
      { candidateIndex: 1, cx: 20, cy: 20, w: 20, h: 20, classId: 1, score: 0.6 },
      { candidateIndex: 2, cx: 30, cy: 30, w: 30, h: 30, classId: 2, score: 0.8 },
    ]);

    // Threshold 0.5 — should keep only two detections
    const result = parseYoloOutput(tensor, NUM_CLASSES, 0.5);
    expect(result).toHaveLength(2);
    expect(result[0].confidence).toBeCloseTo(0.6, 5);
    expect(result[1].confidence).toBeCloseTo(0.8, 5);
  });

  it('returns correct classId and bounding box coordinates', () => {
    const tensor = buildTensor([
      { candidateIndex: 42, cx: 320, cy: 240, w: 100, h: 80, classId: 73, score: 0.95 },
    ]);

    const result = parseYoloOutput(tensor, NUM_CLASSES, 0.4);
    expect(result).toHaveLength(1);
    expect(result[0].classId).toBe(73);
    expect(result[0].x).toBe(320);
    expect(result[0].y).toBe(240);
    expect(result[0].w).toBe(100);
    expect(result[0].h).toBe(80);
  });
});

// ── nonMaxSuppression ───────────────────────────────────────────────────

describe('nonMaxSuppression', () => {
  it('returns all detections when no overlap', () => {
    const detections: RawDetection[] = [
      { classId: 0, confidence: 0.9, x: 50, y: 50, w: 20, h: 20 },
      { classId: 1, confidence: 0.8, x: 200, y: 200, w: 20, h: 20 },
      { classId: 2, confidence: 0.7, x: 400, y: 400, w: 20, h: 20 },
    ];

    const result = nonMaxSuppression(detections, 0.45);
    expect(result).toHaveLength(3);
  });

  it('suppresses overlapping detections with lower confidence', () => {
    // Two boxes at almost the same location — the lower-confidence one is suppressed
    const detections: RawDetection[] = [
      { classId: 0, confidence: 0.6, x: 100, y: 100, w: 50, h: 50 },
      { classId: 0, confidence: 0.9, x: 102, y: 102, w: 50, h: 50 },
    ];

    const result = nonMaxSuppression(detections, 0.45);
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.9);
  });

  it('keeps higher confidence detection when overlap exceeds threshold', () => {
    // Identical boxes — IoU is 1.0, which exceeds any threshold
    const detections: RawDetection[] = [
      { classId: 5, confidence: 0.7, x: 100, y: 100, w: 50, h: 50 },
      { classId: 5, confidence: 0.95, x: 100, y: 100, w: 50, h: 50 },
    ];

    const result = nonMaxSuppression(detections, 0.45);
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.95);
  });
});

// ── calculateIoU ────────────────────────────────────────────────────────

describe('calculateIoU', () => {
  it('returns 1.0 for identical boxes', () => {
    const box: RawDetection = { classId: 0, confidence: 1, x: 100, y: 100, w: 50, h: 50 };
    expect(calculateIoU(box, box)).toBeCloseTo(1.0);
  });

  it('returns 0.0 for non-overlapping boxes', () => {
    const a: RawDetection = { classId: 0, confidence: 1, x: 50, y: 50, w: 20, h: 20 };
    const b: RawDetection = { classId: 0, confidence: 1, x: 200, y: 200, w: 20, h: 20 };
    expect(calculateIoU(a, b)).toBe(0);
  });

  it('returns expected value for partially overlapping boxes', () => {
    // Box A: center (100,100), w=100, h=100  =>  corners (50,50) to (150,150)
    // Box B: center (130,100), w=100, h=100  =>  corners (80,50) to (180,150)
    // Intersection: (80,50) to (150,150) = 70 * 100 = 7000
    // Union: 10000 + 10000 - 7000 = 13000
    // IoU = 7000 / 13000 ≈ 0.5385
    const a: RawDetection = { classId: 0, confidence: 1, x: 100, y: 100, w: 100, h: 100 };
    const b: RawDetection = { classId: 0, confidence: 1, x: 130, y: 100, w: 100, h: 100 };
    const iou = calculateIoU(a, b);
    expect(iou).toBeCloseTo(7000 / 13000, 4);
  });
});
