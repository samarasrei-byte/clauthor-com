/**
 * Safe localStorage wrapper that handles Safari private mode,
 * disabled storage, and quota exceeded errors gracefully.
 */

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage full or disabled — silently ignore
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage disabled — silently ignore
  }
}
