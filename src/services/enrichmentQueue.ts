/**
 * Background enrichment queue with concurrency control, network awareness,
 * and exponential-backoff retry logic.
 *
 * Usage:
 *   import { enrichmentQueue } from '@/services/enrichmentQueue';
 *
 *   enrichmentQueue.onItemEnriched = (itemId, result) => {
 *     // Update your store / database with the enrichment result
 *   };
 *
 *   enrichmentQueue.add(itemId, croppedBase64);
 */

import NetInfo from '@react-native-community/netinfo';
import { enrichItemWithCloudAI } from './cloudAiService';
import type { EnrichmentResult } from '../types/detection';

// ── Types ──────────────────────────────────────────────────────────────

interface QueueEntry {
  itemId: string;
  imageBase64: string;
  retryCount: number;
  /** Timestamp after which this entry may next be attempted. */
  nextAttemptAt: number;
}

type EnrichmentCallback = (
  itemId: string,
  result: EnrichmentResult,
) => void;

// ── Backoff configuration ──────────────────────────────────────────────

/** Retry delays: 1 s, 4 s, 16 s (exponential base 4). */
const RETRY_DELAYS_MS = [1_000, 4_000, 16_000];
const MAX_RETRIES = 3;

// ── Queue class ────────────────────────────────────────────────────────

class EnrichmentQueue {
  private queue: QueueEntry[] = [];
  private activeCount = 0;
  private concurrency = 3;

  /** Called whenever an item is successfully enriched. Set this externally. */
  onItemEnriched: EnrichmentCallback | null = null;

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Add an item to the enrichment queue.
   *
   * @param itemId       Unique item identifier (used for callbacks).
   * @param imageBase64  Base64-encoded JPEG of the cropped detection.
   */
  add(itemId: string, imageBase64: string): void {
    // Avoid duplicates
    if (this.queue.some((entry) => entry.itemId === itemId)) {
      return;
    }

    this.queue.push({
      itemId,
      imageBase64,
      retryCount: 0,
      nextAttemptAt: 0,
    });

    this.processNext();
  }

  /** Number of items waiting in the queue. */
  get pendingCount(): number {
    return this.queue.length;
  }

  /** Clear all pending items from the queue. */
  clear(): void {
    this.queue = [];
  }

  // ── Internal processing ────────────────────────────────────────────

  private async processNext(): Promise<void> {
    // Don't exceed concurrency limit
    if (this.activeCount >= this.concurrency) return;

    // Check network
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      // Retry after a short delay when offline
      setTimeout(() => this.processNext(), 5_000);
      return;
    }

    // Find the next eligible entry
    const now = Date.now();
    const index = this.queue.findIndex(
      (entry) => entry.nextAttemptAt <= now,
    );
    if (index === -1) {
      // All entries are waiting for retry backoff — schedule a check
      if (this.queue.length > 0) {
        const soonest = Math.min(...this.queue.map((e) => e.nextAttemptAt));
        const delay = Math.max(soonest - now, 500);
        setTimeout(() => this.processNext(), delay);
      }
      return;
    }

    // Pull entry from queue
    const entry = this.queue.splice(index, 1)[0];
    this.activeCount++;

    try {
      const result = await enrichItemWithCloudAI(entry.imageBase64);

      // Notify subscriber
      if (this.onItemEnriched) {
        this.onItemEnriched(entry.itemId, result);
      }
    } catch (error) {
      console.warn(
        `[enrichmentQueue] Failed to enrich ${entry.itemId} (attempt ${entry.retryCount + 1}):`,
        error,
      );

      // Retry with exponential backoff
      if (entry.retryCount < MAX_RETRIES) {
        const delayMs =
          RETRY_DELAYS_MS[entry.retryCount] ??
          RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];

        entry.retryCount++;
        entry.nextAttemptAt = Date.now() + delayMs;
        this.queue.push(entry);
      } else {
        console.warn(
          `[enrichmentQueue] Giving up on ${entry.itemId} after ${MAX_RETRIES} retries`,
        );
      }
    } finally {
      this.activeCount--;
    }

    // Continue processing remaining items
    this.processNext();
  }
}

// ── Singleton export ───────────────────────────────────────────────────

export const enrichmentQueue = new EnrichmentQueue();
