import { logger } from '../../logger';

/**
 * Safely parse a JSON string, returning a fallback value if parsing fails.
 * Prevents unhandled exceptions from corrupted or malformed JSON in the database.
 */
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    logger.warn({ snippet: json.substring(0, 100) }, 'Failed to parse JSON');
    return fallback;
  }
}
