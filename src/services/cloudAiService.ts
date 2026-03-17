/**
 * Cloud AI enrichment service using Google Gemini Flash-Lite.
 *
 * Sends a cropped detection image to Gemini and receives structured metadata
 * (name, category, brand, color, material, etc.) that enriches the raw YOLO
 * detection with human-friendly item information.
 */

import type { EnrichmentResult } from '../types/detection';

// ── Configuration ──────────────────────────────────────────────────────

/**
 * API key for the Gemini API.
 * Replace with a real key or load from expo-secure-store / env variable.
 */
const GEMINI_API_KEY = 'YOUR_API_KEY';

/**
 * Gemini Flash-Lite endpoint — fast and cost-effective for structured extraction.
 */
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

// ── Prompt ─────────────────────────────────────────────────────────────

const ENRICHMENT_PROMPT = `You are an expert home inventory assistant. Analyze this image of a household item and return ONLY a valid JSON object with these fields:

{
  "name": "specific, descriptive name of the item",
  "category": "one of: Electronics, Furniture, Clothing, Kitchen, Books, Tools, Toys, Sports, Decor, Personal, Office, Bathroom, Garden, Automotive, Miscellaneous",
  "subcategory": "more specific sub-category",
  "brand": "brand name if visible, otherwise null",
  "color": "primary color(s)",
  "material": "primary material (e.g. plastic, metal, wood, fabric, ceramic)",
  "size_estimate": "approximate size description (e.g. 'small, fits in hand' or '60cm tall')",
  "description": "brief one-sentence description useful for finding this item later",
  "tags": ["array", "of", "searchable", "keywords"]
}

Respond with ONLY the JSON object, no markdown formatting, no code fences.`;

// ── Main enrichment function ───────────────────────────────────────────

/**
 * Send a cropped item image to Gemini Flash-Lite for enrichment.
 *
 * @param croppedImageBase64  Base64-encoded JPEG of the cropped detection.
 * @returns Structured enrichment result or a fallback on failure.
 */
export async function enrichItemWithCloudAI(
  croppedImageBase64: string,
): Promise<EnrichmentResult> {
  try {
    const url = `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: croppedImageBase64,
              },
            },
            {
              text: ENRICHMENT_PROMPT,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 512,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extract the text content from Gemini's response structure
    const textContent =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!textContent) {
      throw new Error('Empty response from Gemini API');
    }

    // Parse the JSON response — strip potential markdown fences just in case
    const cleanedJson = textContent
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    // Map to our EnrichmentResult type (Gemini returns snake_case)
    const result: EnrichmentResult = {
      name: parsed.name ?? 'Unknown item',
      category: parsed.category ?? 'Miscellaneous',
      subcategory: parsed.subcategory ?? '',
      brand: parsed.brand ?? undefined,
      color: parsed.color ?? '',
      material: parsed.material ?? '',
      sizeEstimate: parsed.size_estimate ?? '',
      description: parsed.description ?? '',
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };

    return result;
  } catch (error) {
    console.warn('[cloudAiService] Enrichment failed:', error);

    // Return a minimal fallback so the pipeline doesn't break
    return {
      name: 'Unknown item',
      category: 'Miscellaneous',
      subcategory: '',
      color: '',
      material: '',
      sizeEstimate: '',
      description: 'Could not enrich — AI service unavailable.',
      tags: [],
    };
  }
}
