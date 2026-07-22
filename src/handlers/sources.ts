import type { Env, Source, ApiResponse } from '../types';

export async function listSources(env: Env): Promise<Source[]> {
  const { results } = await env.DB.prepare('SELECT * FROM sources ORDER BY id').all<Source>();
  return results;
}

export async function getSource(env: Env, id: number): Promise<Source | null> {
  const row = await env.DB.prepare('SELECT * FROM sources WHERE id = ?').bind(id).first<Source>();
  return row ?? null;
}

export async function createSource(
  env: Env,
  data: { name: string; url: string; type: string; sync_interval?: number }
): Promise<Source> {
  const result = await env.DB.prepare(
    'INSERT INTO sources (name, url, type, sync_interval) VALUES (?, ?, ?, ?)'
  )
    .bind(data.name, data.url, data.type, data.sync_interval || 3600)
    .run();

  const source = await getSource(env, result.meta.last_row_id as number);
  return source!;
}

export async function updateSource(
  env: Env,
  id: number,
  data: Partial<{ name: string; url: string; enabled: number; sync_interval: number }>
): Promise<Source | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.url !== undefined) { fields.push('url = ?'); values.push(data.url); }
  if (data.enabled !== undefined) { fields.push('enabled = ?'); values.push(data.enabled); }
  if (data.sync_interval !== undefined) { fields.push('sync_interval = ?'); values.push(data.sync_interval); }

  if (fields.length === 0) return getSource(env, id);

  fields.push('updated_at = datetime(\'now\')');
  values.push(id);

  await env.DB.prepare(`UPDATE sources SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getSource(env, id);
}

export async function deleteSource(env: Env, id: number): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM sources WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}
