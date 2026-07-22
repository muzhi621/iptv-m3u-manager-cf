import type { Env, TaskRecord } from '../types';

export async function listTasks(env: Env, limit = 50): Promise<TaskRecord[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM task_records WHERE is_shown = 1 ORDER BY created_at DESC LIMIT ?'
  ).bind(limit).all<TaskRecord>();
  return results;
}

export async function getTask(env: Env, id: string): Promise<TaskRecord | null> {
  return await env.DB.prepare('SELECT * FROM task_records WHERE id = ?').bind(id).first<TaskRecord>() ?? null;
}

export async function createTask(
  env: Env,
  id: string,
  name: string
): Promise<TaskRecord> {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO task_records (id, name, status, progress, message, result, is_shown) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, name, 'pending', 0, '', '{}', 1)
    .run();

  return (await getTask(env, id))!;
}

export async function updateTask(
  env: Env,
  id: string,
  data: Partial<Pick<TaskRecord, 'status' | 'progress' | 'message' | 'result' | 'is_shown'>>
): Promise<void> {
  const fields: string[] = ['updated_at = datetime(\'now\')'];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  values.push(id);
  await env.DB.prepare(`UPDATE task_records SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteTask(env: Env, id: string): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM task_records WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

export async function cleanupTasks(env: Env): Promise<number> {
  const result = await env.DB.prepare(
    'DELETE FROM task_records WHERE status IN (?, ?)'
  ).bind('success', 'failure').run();
  return result.meta.changes;
}
