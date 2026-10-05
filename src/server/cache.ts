/**
 * Tiny in-process cache for database reads. Hostinger runs one Node process, so admin writes
 * call `invalidateCache()` and every visitor sees the change on their next request.
 * If a refresh fails (e.g. D1 hiccup) the last good value keeps being served.
 */
type Entry = { at: number; value?: unknown; pending?: Promise<unknown> };

const g = globalThis as unknown as { __wowCache?: Map<string, Entry> };
const store = (g.__wowCache ??= new Map());

export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const entry = store.get(key);
  const fresh = entry && 'value' in entry && Date.now() - entry.at < ttlMs;
  if (fresh) return entry.value as T;
  if (entry?.pending) return entry.pending as Promise<T>;

  const pending = load()
    .then((value) => {
      store.set(key, { at: Date.now(), value });
      return value;
    })
    .catch((err) => {
      const stale = store.get(key);
      if (stale && 'value' in stale) {
        console.error(`[cache] refresh of "${key}" failed, serving stale data`, err);
        store.set(key, { at: Date.now() - ttlMs + 10_000, value: stale.value }); // retry in 10s
        return stale.value as T;
      }
      store.delete(key);
      throw err;
    });
  store.set(key, { ...(entry ?? { at: 0 }), pending });
  return pending;
}

export function invalidateCache() {
  store.clear();
}
