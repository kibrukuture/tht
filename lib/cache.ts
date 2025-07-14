// We could have used redis or a similar cache solution, but this is a simple
// in-memory cache for the sake of the demo.
type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache: Map<string, CacheEntry<unknown>> = new Map();

export function setCache<T>(key: string, data: T, ttl: number = 300000): void {
  const expiresAt = Date.now() + ttl;
  const entry: CacheEntry<T> = { data, expiresAt };
  cache.set(key, entry);
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}
