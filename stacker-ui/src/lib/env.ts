declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

export function env(key: string): string | undefined {
  return window.__ENV__?.[key] ?? import.meta.env[key];
}
