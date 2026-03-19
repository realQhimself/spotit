import { useScanStore } from '../useScanStore';
import type { Detection } from '../../types/detection';

// Reset store between tests
beforeEach(() => {
  useScanStore.setState({
    scanMode: null,
    isScanning: false,
    detections: [],
    capturedPhotoUri: null,
    selectedRoomId: null,
    selectedZoneId: null,
  });
});

const mockDetection: Detection = {
  id: 'det-1',
  classId: 62,
  className: 'laptop',
  confidence: 0.92,
  bbox: { x: 100, y: 100, width: 200, height: 150 },
};

describe('useScanStore', () => {
  it('has correct initial state', () => {
    const state = useScanStore.getState();
    expect(state.scanMode).toBeNull();
    expect(state.isScanning).toBe(false);
    expect(state.detections).toEqual([]);
    expect(state.capturedPhotoUri).toBeNull();
    expect(state.selectedRoomId).toBeNull();
    expect(state.selectedZoneId).toBeNull();
  });

  it('addDetection adds to detections array', () => {
    useScanStore.getState().addDetection(mockDetection);
    expect(useScanStore.getState().detections).toHaveLength(1);
    expect(useScanStore.getState().detections[0]).toEqual(mockDetection);

    // Add another
    const second: Detection = { ...mockDetection, id: 'det-2', className: 'cup' };
    useScanStore.getState().addDetection(second);
    expect(useScanStore.getState().detections).toHaveLength(2);
  });

  it('clearDetections resets the detections array', () => {
    useScanStore.getState().addDetection(mockDetection);
    expect(useScanStore.getState().detections).toHaveLength(1);

    useScanStore.getState().clearDetections();
    expect(useScanStore.getState().detections).toEqual([]);
  });

  it('setRoom updates selectedRoomId', () => {
    useScanStore.getState().setRoom('room-123');
    expect(useScanStore.getState().selectedRoomId).toBe('room-123');

    useScanStore.getState().setRoom(null);
    expect(useScanStore.getState().selectedRoomId).toBeNull();
  });

  it('setZone updates selectedZoneId', () => {
    useScanStore.getState().setZone('zone-abc');
    expect(useScanStore.getState().selectedZoneId).toBe('zone-abc');

    useScanStore.getState().setZone(null);
    expect(useScanStore.getState().selectedZoneId).toBeNull();
  });

  it('startScan sets mode, isScanning, and resets detections', () => {
    // Pre-populate some state
    useScanStore.getState().addDetection(mockDetection);
    useScanStore.getState().setCapturedPhoto('file://old-photo.jpg');

    useScanStore.getState().startScan('room');

    const state = useScanStore.getState();
    expect(state.scanMode).toBe('room');
    expect(state.isScanning).toBe(true);
    expect(state.detections).toEqual([]);
    expect(state.capturedPhotoUri).toBeNull();
  });

  it('stopScan sets isScanning to false', () => {
    useScanStore.getState().startScan('quick');
    expect(useScanStore.getState().isScanning).toBe(true);

    useScanStore.getState().stopScan();
    expect(useScanStore.getState().isScanning).toBe(false);
  });

  it('updateDetection updates the specified detection', () => {
    useScanStore.getState().addDetection(mockDetection);
    useScanStore.getState().updateDetection('det-1', {
      className: 'MacBook Pro',
      confidence: 0.99,
    });

    const updated = useScanStore.getState().detections[0];
    expect(updated.className).toBe('MacBook Pro');
    expect(updated.confidence).toBe(0.99);
    // Other fields unchanged
    expect(updated.classId).toBe(62);
  });

  it('setCapturedPhoto updates the photo URI', () => {
    useScanStore.getState().setCapturedPhoto('file://photo.jpg');
    expect(useScanStore.getState().capturedPhotoUri).toBe('file://photo.jpg');
  });
});
