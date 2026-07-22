import type { Env, Channel } from '../types';

export async function listChannels(
  env: Env,
  opts: { page?: number; page_size?: number; group?: string; source_id?: number; search?: string; enabled_only?: boolean } = {}
): Promise<{ data: Channel[]; total: number }> {
  const { page = 1, page_size = 50, group, source_id, search, enabled_only } = opts;
  const offset = (page - 1) * page_size;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (group) { conditions.push('group_title = ?'); params.push(group); }
  if (source_id) { conditions.push('source_id = ?'); params.push(source_id); }
  if (search) { conditions.push('(name LIKE ? OR tvg_name LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (enabled_only) { conditions.push('enabled = 1'); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM channels ${where}`)
    .bind(...params)
    .first<{ count: number }>();

  const { results } = await env.DB.prepare(
    `SELECT * FROM channels ${where} ORDER BY group_title, name LIMIT ? OFFSET ?`
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
  data: Partial<Pick<Channel, 'enabled' | 'group_title' | 'name' | 'status'>>
): Promise<Channel | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.enabled !== undefined) { fields.push('enabled = ?'); values.push(data.enabled); }
  if (data.group_title !== undefined) { fields.push('group_title = ?'); values.push(data.group_title); }
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }

  if (fields.length === 0) return getChannel(env, id);

  fields.push('updated_at = datetime(\'now\')');
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
  data: Partial<Pick<Channel, 'enabled' | 'group_title'>>
): Promise<void> {
  if (ids.length === 0) return;

  const fields: string[] = ['updated_at = datetime(\'now\')'];
  const baseValues: unknown[] = [];

  if (data.enabled !== undefined) { fields.push('enabled = ?'); baseValues.push(data.enabled); }
  if (data.group_title !== undefined) { fields.push('group_title = ?'); baseValues.push(data.group_title); }

  const placeholders = ids.map(() => '?').join(',');
  await env.DB.prepare(
    `UPDATE channels SET ${fields.join(', ')} WHERE id IN (${placeholders})`
  )
    .bind(...baseValues, ...ids)
    .run();
}

export async function insertChannels(
  env: Env,
  sourceId: number,
  channels: Array<{ name: string; tvg_name: string; tvg_id: string; tvg_logo: string; group_title: string; url: string; tvg_chno: string }>
): Promise<number> {
  if (channels.length === 0) return 0;

  // Delete existing channels for this source first
  await env.DB.prepare('DELETE FROM channels WHERE source_id = ?').bind(sourceId).run();

  // Batch insert (D1 supports up to 100 statements per batch)
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < channels.length; i += BATCH_SIZE) {
    const batch = channels.slice(i, i + BATCH_SIZE);
    const stmts = batch.map((ch) =>
      env.DB.prepare(
        'INSERT INTO channels (source_id, name, tvg_name, tvg_id, tvg_logo, group_title, url, tvg_chno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(sourceId, ch.name, ch.tvg_name, ch.tvg_id, ch.tvg_logo, ch.group_title, ch.url, ch.tvg_chno)
    );
    await env.DB.batch(stmts);
    inserted += batch.length;
  }

  return inserted;
}
