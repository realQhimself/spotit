import {
  COCO_CLASSES,
  COCO_CLASS_TO_CATEGORY,
  isRelevantClass,
} from '../cocoClasses';

describe('COCO_CLASSES', () => {
  it('has exactly 80 entries', () => {
    expect(COCO_CLASSES).toHaveLength(80);
  });
});

describe('isRelevantClass', () => {
  it('returns false for irrelevant outdoor/vehicle/person classes', () => {
    expect(isRelevantClass('traffic light')).toBe(false);
    expect(isRelevantClass('car')).toBe(false);
    expect(isRelevantClass('airplane')).toBe(false);
    expect(isRelevantClass('person')).toBe(false);
  });

  it('returns true for relevant household item classes', () => {
    expect(isRelevantClass('cup')).toBe(true);
    expect(isRelevantClass('laptop')).toBe(true);
    expect(isRelevantClass('book')).toBe(true);
    expect(isRelevantClass('chair')).toBe(true);
    expect(isRelevantClass('cell phone')).toBe(true);
  });
});

describe('COCO_CLASS_TO_CATEGORY', () => {
  it('maps all 80 COCO classes to a category', () => {
    for (const className of COCO_CLASSES) {
      expect(COCO_CLASS_TO_CATEGORY).toHaveProperty(className);
      expect(typeof COCO_CLASS_TO_CATEGORY[className]).toBe('string');
    }
  });

  it('maps specific classes to expected categories', () => {
    expect(COCO_CLASS_TO_CATEGORY['laptop']).toBe('Electronics');
    expect(COCO_CLASS_TO_CATEGORY['chair']).toBe('Furniture');
    expect(COCO_CLASS_TO_CATEGORY['book']).toBe('Books');
    expect(COCO_CLASS_TO_CATEGORY['cup']).toBe('Kitchen');
    expect(COCO_CLASS_TO_CATEGORY['toothbrush']).toBe('Bathroom');
  });
});
