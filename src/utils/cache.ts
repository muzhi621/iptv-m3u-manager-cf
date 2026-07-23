import type { Env } from '../types';

const CACHE_PREFIX = 'cache:';
const DEFAULT_TTL = 3600; // 1 hour

export async function cacheGet<T>(env: Env, key: string): Promise<T | null> {
  const value = await env.CACHE.get(CACHE_PREFIX + key, { type: 'json' });
  return value as T | null;
}

export async function cacheSet<T>(
  env: Env,
  key: string,
  value: T,
  ttl = DEFAULT_TTL
): Promise<void> {
  await env.CACHE.put(CACHE_PREFIX + key, JSON.stringify(value), {
    expirationTtl: ttl,
  });
}

export async function cacheDelete(env: Env, key: string): Promise<void> {
  await env.CACHE.delete(CACHE_PREFIX + key);
}

export async function cacheFlush(env: Env, prefix: string): Promise<void> {
  const list = await env.CACHE.list({ prefix: CACHE_PREFIX + prefix });
  if (list.keys.length > 0) {
    for (const key of list.keys) {
      await env.CACHE.delete(key.name);
    }
  }
}
