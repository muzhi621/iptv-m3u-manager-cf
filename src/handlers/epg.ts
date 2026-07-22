import type { Env } from '../types';

export interface EpgProgram {
  channel_name: string;
  channel_id: string;
  start: string;
  end: string;
  title: string;
  description: string;
}

export async function getCurrentProgram(
  env: Env,
  channelId: number
): Promise<{ title: string; start: string; end: string } | null> {
  const channel = await env.DB.prepare('SELECT tvg_name, tvg_id FROM channels WHERE id = ?')
    .bind(channelId).first<{ tvg_name: string; tvg_id: string }>();

  if (!channel) return null;

  // Check KV cache for EPG data
  const cacheKey = `epg:${channel.tvg_name || channel.tvg_id}`;
  const cached = await env.CACHE.get(cacheKey, { type: 'json' }) as EpgProgram[] | null;

  if (!cached) return null;

  const now = new Date().toISOString();
  const current = cached.find((p) => p.start <= now && p.end >= now);
  if (!current) return null;

  return {
    title: current.title,
    start: current.start,
    end: current.end,
  };
}

export async function batchMatchEpg(
  env: Env,
  channelIds: number[]
): Promise<{ matched: number; total: number }> {
  let matched = 0;
  for (const id of channelIds) {
    const result = await getCurrentProgram(env, id);
    if (result) matched++;
  }
  return { matched, total: channelIds.length };
}
