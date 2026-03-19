/**
 * Tests for the background enrichment queue.
 *
 * Since enrichmentQueue is a singleton, we use jest.isolateModules()
 * to get a fresh instance for each test.
 */

import type { EnrichmentResult } from '../../types/detection';

const successResult: EnrichmentResult = {
  name: 'Test Item',
  category: 'Electronics',
  subcategory: 'Gadget',
  color: 'Black',
  material: 'Plastic',
  sizeEstimate: 'Small',
  description: 'A test item',
  tags: ['test'],
};

/**
 * Helper: flush microtask queue.
 */
async function flushPromises(times = 15) {
  for (let i = 0; i < times; i++) {
    await new Promise((r) => setImmediate(r));
  }
}

/**
 * Helper: get a fresh queue and its mocked enrichment function.
 */
function createIsolatedQueue(mockImpl: (...args: any[]) => Promise<EnrichmentResult>) {
  let queue: any;
  let mockEnrich: jest.Mock;

  jest.isolateModules(() => {
    // Set up mocks before requiring the module
    jest.doMock('@react-native-community/netinfo', () => ({
      __esModule: true,
      default: {
        fetch: jest.fn().mockResolvedValue({ isConnected: true }),
      },
    }));

    mockEnrich = jest.fn().mockImplementation(mockImpl);
    jest.doMock('../cloudAiService', () => ({
      enrichItemWithCloudAI: mockEnrich,
    }));

    queue = require('../enrichmentQueue').enrichmentQueue;
  });

  return { queue, mockEnrich: mockEnrich! };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('enrichmentQueue', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('add() queues items and pendingCount reflects queue size', async () => {
    const resolvers: Array<() => void> = [];
    const { queue, mockEnrich } = createIsolatedQueue(
      () => new Promise<EnrichmentResult>((resolve) => {
        resolvers.push(() => resolve(successResult));
      }),
    );

    queue.add('item-1', 'base64-1');
    queue.add('item-2', 'base64-2');
    queue.add('item-3', 'base64-3');

    await flushPromises();

    // All 3 should have been picked up (concurrency = 3)
    expect(mockEnrich).toHaveBeenCalledTimes(3);

    // Cleanup
    resolvers.forEach((r) => r());
    await flushPromises();
  });

  it('duplicate items are not added', async () => {
    const { queue } = createIsolatedQueue(
      () => new Promise<EnrichmentResult>(() => {}), // never resolves
    );

    // Saturate concurrency (3 active slots)
    queue.add('a', 'img-a');
    queue.add('b', 'img-b');
    queue.add('c', 'img-c');
    await flushPromises();

    // Items beyond concurrency go to waiting queue
    queue.add('d', 'img-d');
    queue.add('d', 'img-d'); // duplicate — rejected
    queue.add('d', 'img-d'); // duplicate — rejected

    expect(queue.pendingCount).toBe(1);
  });

  it('clear() empties the pending queue', async () => {
    const { queue } = createIsolatedQueue(
      () => new Promise<EnrichmentResult>(() => {}), // never resolves
    );

    // Saturate concurrency
    queue.add('a', 'img');
    queue.add('b', 'img');
    queue.add('c', 'img');
    await flushPromises();

    // Add items to the waiting queue
    queue.add('d', 'img');
    queue.add('e', 'img');
    expect(queue.pendingCount).toBe(2);

    queue.clear();
    expect(queue.pendingCount).toBe(0);
  });

  it('onItemEnriched callback is called on success', async () => {
    const { queue } = createIsolatedQueue(async () => successResult);

    const callback = jest.fn();
    queue.onItemEnriched = callback;

    queue.add('mug-1', 'base64-mug');

    await flushPromises();

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('mug-1', successResult);
  });

  it('retries on failure with backoff', async () => {
    jest.useFakeTimers();

    let callCount = 0;
    const { queue } = createIsolatedQueue(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Temporary failure');
      }
      return successResult;
    });

    const callback = jest.fn();
    queue.onItemEnriched = callback;

    queue.add('retry-item', 'base64-retry');

    // First attempt — will fail
    // Use advanceTimersByTimeAsync which also flushes microtasks
    await jest.advanceTimersByTimeAsync(100);

    // Item should be back in queue with backoff
    expect(queue.pendingCount).toBe(1);
    expect(callback).not.toHaveBeenCalled();

    // Advance past the first retry delay (1000ms)
    await jest.advanceTimersByTimeAsync(2000);

    // Second attempt should succeed
    expect(callback).toHaveBeenCalledWith('retry-item', successResult);

    jest.useRealTimers();
  });
});
