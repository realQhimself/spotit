/**
 * Tests for the cloud AI enrichment service (Gemini API).
 */

// ── Mock fetch globally ─────────────────────────────────────────────────

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset module registry so GEMINI_API_KEY is re-evaluated
  jest.resetModules();
  global.fetch = jest.fn() as jest.Mock;
});

afterEach(() => {
  process.env = originalEnv;
});

// ── Tests ───────────────────────────────────────────────────────────────

describe('enrichItemWithCloudAI', () => {
  it('returns fallback when API key is empty', async () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_GEMINI_API_KEY: '' };
    const { enrichItemWithCloudAI } = require('../cloudAiService');

    const result = await enrichItemWithCloudAI('base64data');

    expect(result.name).toBe('Unknown item');
    expect(result.category).toBe('Miscellaneous');
    expect(result.description).toContain('no API key');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('parses a successful Gemini response correctly', async () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_GEMINI_API_KEY: 'test-key-123' };
    const { enrichItemWithCloudAI } = require('../cloudAiService');

    const geminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  name: 'MacBook Pro',
                  category: 'Electronics',
                  subcategory: 'Laptop',
                  brand: 'Apple',
                  color: 'Silver',
                  material: 'Aluminum',
                  size_estimate: '35cm wide',
                  description: 'A silver Apple laptop',
                  tags: ['laptop', 'apple', 'macbook'],
                }),
              },
            ],
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(geminiResponse),
    });

    const result = await enrichItemWithCloudAI('base64data');

    expect(result.name).toBe('MacBook Pro');
    expect(result.category).toBe('Electronics');
    expect(result.subcategory).toBe('Laptop');
    expect(result.brand).toBe('Apple');
    expect(result.color).toBe('Silver');
    expect(result.material).toBe('Aluminum');
    expect(result.sizeEstimate).toBe('35cm wide');
    expect(result.tags).toEqual(['laptop', 'apple', 'macbook']);
  });

  it('handles non-200 status codes gracefully', async () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_GEMINI_API_KEY: 'test-key-123' };
    const { enrichItemWithCloudAI } = require('../cloudAiService');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limited'),
    });

    const result = await enrichItemWithCloudAI('base64data');

    // Should return fallback, not throw
    expect(result.name).toBe('Unknown item');
    expect(result.description).toContain('AI service unavailable');
  });

  it('handles malformed JSON response', async () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_GEMINI_API_KEY: 'test-key-123' };
    const { enrichItemWithCloudAI } = require('../cloudAiService');

    const geminiResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'this is not valid json {{{' }],
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(geminiResponse),
    });

    const result = await enrichItemWithCloudAI('base64data');

    expect(result.name).toBe('Unknown item');
    expect(result.category).toBe('Miscellaneous');
  });

  it('handles empty Gemini response (no text content)', async () => {
    process.env = { ...originalEnv, EXPO_PUBLIC_GEMINI_API_KEY: 'test-key-123' };
    const { enrichItemWithCloudAI } = require('../cloudAiService');

    const geminiResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: '' }],
          },
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(geminiResponse),
    });

    const result = await enrichItemWithCloudAI('base64data');

    expect(result.name).toBe('Unknown item');
    expect(result.description).toContain('AI service unavailable');
  });
});
