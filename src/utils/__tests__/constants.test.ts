import { SCAN, CATEGORIES } from '../constants';

describe('SCAN constants', () => {
  it('CONFIDENCE_THRESHOLD is 0.5', () => {
    expect(SCAN.CONFIDENCE_THRESHOLD).toBe(0.5);
  });

  it('MAX_DETECTIONS is 20', () => {
    expect(SCAN.MAX_DETECTIONS).toBe(20);
  });

  it('NMS_IOU_THRESHOLD is 0.45', () => {
    expect(SCAN.NMS_IOU_THRESHOLD).toBe(0.45);
  });

  it('CAPTURE_QUALITY is 0.85', () => {
    expect(SCAN.CAPTURE_QUALITY).toBe(0.85);
  });
});

describe('CATEGORIES', () => {
  it('contains expected category values', () => {
    expect(CATEGORIES).toContain('Electronics');
    expect(CATEGORIES).toContain('Furniture');
    expect(CATEGORIES).toContain('Kitchen');
    expect(CATEGORIES).toContain('Books');
    expect(CATEGORIES).toContain('Miscellaneous');
    expect(CATEGORIES).toContain('Bathroom');
    expect(CATEGORIES).toContain('Garden');
    expect(CATEGORIES).toContain('Automotive');
  });

  it('has 15 categories', () => {
    expect(CATEGORIES).toHaveLength(15);
  });
});
