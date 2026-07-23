import type { Env, Channel } from '../types';

export async function listChannels(
  env: Env,
  opts: { page?: number; page_size?: number; group?: string; subscription_id?: number; search?: string; enabled_only?: boolean } = {}
): Promise<{ data: Channel[]; total: number }> {
  const { page = 1, page_size = 50, group, subscription_id, search, enabled_only } = opts;
  const offset = (page - 1) * page_size;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (group) { conditions.push('"group" = ?'); params.push(group); }
  if (subscription_id) { conditions.push('subscription_id = ?'); params.push(subscription_id); }
  if (search) { conditions.push('(name LIKE ? OR tvg_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (enabled_only) { conditions.push('is_enabled = 1'); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM channels ${where}`)
    .bind(...params)
    .first<{ count: number }>();

  const { results } = await env.DB.prepare(
    `SELECT * FROM channels ${where} ORDER BY "group", name LIMIT ? OFFSET ?`
  )
    .bind(...params, page_size, offset)
    .all<Channel>();

  return { data: results, total: countResult?.count || 0 };
}

export async function getChannel(env: Env, id: number): Promise<Channel | null> {
  return await env.DB.prepare('SELECT * FROM channels WHERE id = ?').bind(id).first<Channel>() ?? null;
}

export async function updateChannel(
  env: Env,
  id: number,
  data: Partial<Pick<Channel, 'is_enabled' | 'group' | 'name'>>
): Promise<Channel | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.is_enabled !== undefined) { fields.push('is_enabled = ?'); values.push(data.is_enabled); }
  if (data.group !== undefined) { fields.push('"group" = ?'); values.push(data.group); }
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }

  if (fields.length === 0) return getChannel(env, id);

  values.push(id);

  await env.DB.prepare(`UPDATE channels SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getChannel(env, id);
}

export async function deleteChannel(env: Env, id: number): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM channels WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

export async function batchUpdateChannels(
  env: Env,
  ids: number[],
  data: Partial<Pick<Channel, 'is_enabled' | 'group'>>
): Promise<void> {
  if (ids.length === 0) return;

  const fields: string[] = [];
  const baseValues: unknown[] = [];

  if (data.is_enabled !== undefined) { fields.push('is_enabled = ?'); baseValues.push(data.is_enabled); }
  if (data.group !== undefined) { fields.push('"group" = ?'); baseValues.push(data.group); }

  if (fields.length === 0) return;

  const placeholders = ids.map(() => '?').join(',');
  await env.DB.prepare(
    `UPDATE channels SET ${fields.join(', ')} WHERE id IN (${placeholders})`
  )
    .bind(...baseValues, ...ids)
    .run();
}

export async function insertChannels(
  env: Env,
  subscriptionId: number,
  channels: Array<{ name: string; tvg_name: string; tvg_id: string; logo: string; group: string; url: string }>
): Promise<number> {
  if (channels.length === 0) return 0;

  // Delete existing channels for this subscription first
  await env.DB.prepare('DELETE FROM channels WHERE subscription_id = ?').bind(subscriptionId).run();

  // Batch insert (D1 supports up to 100 statements per batch)
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < channels.length; i += BATCH_SIZE) {
    const batch = channels.slice(i, i + BATCH_SIZE);
    const stmts = batch.map((ch) =>
      env.DB.prepare(
        'INSERT INTO channels (subscription_id, name, tvg_name, tvg_id, logo, "group", url) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(subscriptionId, ch.name, ch.tvg_name, ch.tvg_id, ch.logo, ch.group, ch.url)
    );
    await env.DB.batch(stmts);
    inserted += batch.length;
  }

  return inserted;
}
