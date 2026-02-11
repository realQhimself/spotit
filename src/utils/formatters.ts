/**
 * Formatting helper functions used across the SpotIt app.
 */

/**
 * Return a human-friendly relative date string (e.g. "just now", "3 min ago",
 * "2 hours ago", "Yesterday", or the locale date).
 */
export function formatRelativeDate(date: Date | string): string {
  const then = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return then.toLocaleDateString();
}

/**
 * Normalize a raw category string to title case.
 * e.g. "electronics" -> "Electronics"
 */
export function formatCategory(raw: string): string {
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/**
 * Format a confidence score (0-1) as a percentage string.
 * e.g. 0.923 -> "92%"
 */
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Build a breadcrumb string from location parts.
 * e.g. ("Living Room", "Shelf A", "Top") -> "Living Room > Shelf A > Top"
 */
export function formatLocationBreadcrumb(
  roomName: string,
  zoneName?: string,
  layer?: string,
): string {
  const parts = [roomName];
  if (zoneName) parts.push(zoneName);
  if (layer) parts.push(layer);
  return parts.join(' > ');
}
