/** Creates browser-safe IDs without requiring a database or a third-party package. */
export function createId(prefix: string) {
  const uuid = globalThis.crypto?.randomUUID?.();

  if (uuid) {
    return `${prefix}_${uuid}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
