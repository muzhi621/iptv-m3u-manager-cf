import type { Env, EpgSource } from '../types';

export async function listEpgSources(env: Env): Promise<EpgSource[]> {
  const { results } = await env.DB.prepare('SELECT * FROM epg_sources ORDER BY id').all<EpgSource>();
  return results;
}

export async function createEpgSource(
  env: Env,
  data: { name: string; url: string }
): Promise<EpgSource> {
  const result = await env.DB.prepare(
    'INSERT INTO epg_sources (name, url) VALUES (?, ?)'
  )
    .bind(data.name, data.url)
    .run();

  return (await env.DB.prepare('SELECT * FROM epg_sources WHERE id = ?')
    .bind(result.meta.last_row_id).first<EpgSource>())!;
}

export async function deleteEpgSource(env: Env, id: number): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM epg_sources WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

export async function syncEpgSource(env: Env, id: number): Promise<{ success: boolean; message: string }> {
  const source = await env.DB.prepare('SELECT * FROM epg_sources WHERE id = ?')
    .bind(id).first<EpgSource>();

  if (!source) return { success: false, message: 'EPG source not found' };

  // Queue sync task
  await env.TASK_QUEUE.send({
    type: 'epg_sync',
    source_id: id,
    source_url: source.url,
  });

  return { success: true, message: 'EPG sync queued' };
}
