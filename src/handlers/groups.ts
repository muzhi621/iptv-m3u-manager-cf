import type { Env, Group } from '../types';

export async function listGroups(env: Env): Promise<Group[]> {
  const { results } = await env.DB.prepare('SELECT * FROM groups ORDER BY sort_order, name').all<Group>();
  return results;
}

export async function getGroup(env: Env, id: number): Promise<Group | null> {
  return await env.DB.prepare('SELECT * FROM groups WHERE id = ?').bind(id).first<Group>() ?? null;
}

export async function createGroup(
  env: Env,
  data: { name: string; display_name: string; sort_order?: number }
): Promise<Group> {
  const result = await env.DB.prepare(
    'INSERT INTO groups (name, display_name, sort_order) VALUES (?, ?, ?)'
  )
    .bind(data.name, data.display_name, data.sort_order || 0)
    .run();

  return getGroup(env, result.meta.last_row_id as number)!;
}

export async function updateGroup(
  env: Env,
  id: number,
  data: Partial<{ display_name: string; sort_order: number }>
): Promise<Group | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.display_name !== undefined) { fields.push('display_name = ?'); values.push(data.display_name); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }

  if (fields.length === 0) return getGroup(env, id);

  values.push(id);
  await env.DB.prepare(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getGroup(env, id);
}

export async function deleteGroup(env: Env, id: number): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}
