import type { Env } from '../types';
import {
  refreshEpg,
  lookupProgram,
  batchLookupChannels,
  splitEpgUrls,
  type EpgData,
} from '../services/epg-parser';
import { getOutputSource, aggregateChannels } from './outputs';
import { createTask, updateTask } from './tasks';

// === Single Channel EPG Lookup ===

export async function getCurrentProgram(
  env: Env,
  channelId: number
): Promise<{ title: string; logo: string | null } | null> {
  const channel = await env.DB.prepare(
    'SELECT tvg_name, tvg_id, logo FROM channels WHERE id = ?'
  ).bind(channelId).first<{ tvg_name: string; tvg_id: string; logo: string }>();

  if (!channel) return null;

  // Try to find EPG URL from associated output sources
  const outputs = await env.DB.prepare(
    'SELECT epg_url FROM output_sources WHERE epg_url != "" LIMIT 1'
  ).all<{ epg_url: string }>();

  if (outputs.length === 0) return null;

  const epgUrl = outputs[0].epg_url;
  return lookupProgram(env, epgUrl, channel.tvg_id, channel.tvg_name, env.CACHE, channel.logo);
}

// === Batch EPG Match ===

export async function batchMatchEpg(
  env: Env,
  channelIds: number[]
): Promise<{ matched: number; total: number; results: Array<{ id: number; title: string }> }> {
  // Get channels
  const placeholders = channelIds.map(() => '?').join(',');
  const channels = await env.DB.prepare(
    `SELECT id, tvg_name, tvg_id, logo FROM channels WHERE id IN (${placeholders})`
  ).bind(...channelIds).all<{ id: number; tvg_name: string; tvg_id: string; logo: string }>();

  // Find EPG URL
  const outputs = await env.DB.prepare(
    'SELECT epg_url FROM output_sources WHERE epg_url != "" LIMIT 1'
  ).all<{ epg_url: string }>();

  if (outputs.length === 0) {
    return {
      matched: 0,
      total: channelIds.length,
      results: channelIds.map((id) => ({ id, title: '无 EPG 源' })),
    };
  }

  const epgUrl = outputs[0].epg_url;
  const lookupResults = await batchLookupChannels(env, epgUrl, channels, env.CACHE);

  let matched = 0;
  const results: Array<{ id: number; title: string }> = [];

  for (const ch of channels) {
    const result = lookupResults.get(ch.id);
    const title = result?.title || '无节目信息';
    if (title !== '无节目信息' && title !== '无 EPG 数据') matched++;
    results.push({ id: ch.id, title });
  }

  return { matched, total: channelIds.length, results };
}

// === EPG Sync Task ===

export async function syncEpgSources(
  env: Env,
  outputId: number
): Promise<{ success: boolean; message: string }> {
  const output = await getOutputSource(env, outputId);
  if (!output) return { success: false, message: 'Output source not found' };

  const epgUrl = output.epg_url;
  if (!epgUrl) return { success: false, message: 'No EPG URL configured' };

  const taskId = `epg-sync-${outputId}-${Date.now()}`;
  await createTask(env, taskId, `EPG 同步: ${output.name}`);

  try {
    await updateTask(env, taskId, { status: 'running', progress: 10, message: '正在解析 EPG...' });

    const data = await refreshEpg(epgUrl, env.CACHE, true);
    if (!data) {
      await updateTask(env, taskId, { status: 'failure', message: 'EPG 数据为空' });
      return { success: false, message: 'EPG data is empty' };
    }

    await updateTask(env, taskId, { progress: 50, message: `已解析 ${data.channels.size} 个频道` });

    // Match channels
    const channels = await aggregateChannels(env, output);
    const channelData = channels.map((ch) => ({
      id: ch.id,
      tvg_id: ch.tvg_id,
      tvg_name: ch.tvg_name,
      logo: ch.logo,
    }));

    const matchResults = await batchLookupChannels(env, epgUrl, channelData, env.CACHE);

    let matched = 0;
    for (const [, result] of matchResults) {
      if (result.title !== '无节目信息' && result.title !== '无 EPG 数据') matched++;
    }

    await updateTask(env, taskId, {
      status: 'success',
      progress: 100,
      message: `EPG 同步完成: ${data.channels.size} 频道, ${matched}/${channelData.length} 匹配`,
      result: JSON.stringify({
        channels: data.channels.size,
        programs: data.programs.size,
        matched,
        total: channelData.length,
      }),
    });

    return { success: true, message: `EPG synced: ${matched}/${channelData.length} channels matched` };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTask(env, taskId, { status: 'failure', message: msg });
    return { success: false, message: msg };
  }
}

// === Get EPG Sources Info ===

export async function getEpgSourcesInfo(env: Env): Promise<Array<{ id: number; name: string; epg_url: string }>> {
  const { results } = await env.DB.prepare(
    'SELECT id, name, epg_url FROM output_sources WHERE epg_url != ""'
  ).all<{ id: number; name: string; epg_url: string }>();
  return results;
}

// Re-export splitEpgUrls for use in routes
export { splitEpgUrls };
