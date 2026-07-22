import type { Env } from '../types';

const R2_PREFIX = 'iptv/';

export async function storagePut(
  env: Env,
  key: string,
  body: ReadableStream | ArrayBuffer | string,
  contentType = 'application/octet-stream'
): Promise<void> {
  await env.STORAGE.put(R2_PREFIX + key, body, { httpMetadata: { contentType } });
}

export async function storageGet(
  env: Env,
  key: string
): Promise<R2ObjectBody | null> {
  const obj = await env.STORAGE.get(R2_PREFIX + key);
  return obj as R2ObjectBody | null;
}

export async function storageDelete(env: Env, key: string): Promise<void> {
  await env.STORAGE.delete(R2_PREFIX + key);
}

export async function storageList(
  env: Env,
  prefix: string,
  limit = 100
): Promise<R2Object[]> {
  const list = await env.STORAGE.list({ prefix: R2_PREFIX + prefix, limit });
  return list.objects;
}
