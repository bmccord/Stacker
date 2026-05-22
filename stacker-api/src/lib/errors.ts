/**
 * Extract a user-friendly error message from a caught error.
 * Handles Apollo GraphQL errors, standard Error objects, and unknown types.
 */
export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- error shape varies
    const e = err as Record<string, any>;
    return e.graphQLErrors?.[0]?.message ?? e.message ?? String(err);
  }
  return String(err);
}
