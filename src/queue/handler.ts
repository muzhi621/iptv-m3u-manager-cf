import type { Env, SyncTaskPayload, DetectTaskPayload } from '../types';
import { parseM3U } from '../services/m3u-parser';
import { mergeChannels } from '../services/channel-merger';
import { insertChannels } from '../handlers/channels';

export async function handleQueueMessage(
  message: Message<unknown>,
  env: Env
): Promise<void> {
  const payload = message.body as Record<string, unknown>;

  switch (payload.type) {
    case 'sync':
      await handleSync(payload as unknown as SyncTaskPayload, env);
      break;
    case 'detect':
      await handleDetect(payload as unknown as DetectTaskPayload, env);
      break;
    case 'epg_sync':
      await handleEpgSync(payload as { source_id: number; source_url: string }, env);
      break;
    default:
      console.error(`Unknown task type: ${payload.type}`);
  }
}

async function handleSync(payload: SyncTaskPayload, env: Env): Promise<void> {
  const { source_id, source_url, source_type } = payload;

  // Create task record
  const taskResult = await env.DB.prepare(
    'INSERT INTO tasks (type, status, params) VALUES (?, ?, ?)'
  )
    .bind('sync', 'running', JSON.stringify(payload))
    .run();

  const taskId = taskResult.meta.last_row_id;

  try {
    // Fetch M3U content
    const response = await fetch(source_url, {
      headers: { 'User-Agent': 'IPTV-M3U-Manager/1.0' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let content = await response.text();

    // Handle GitHub raw URLs - follow redirects
    if (source_type === 'github' && !content.includes('#EXTM3U')) {
      // Try raw.githubusercontent.com
      const rawUrl = source_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      const rawResponse = await fetch(rawUrl, {
        headers: { 'User-Agent': 'IPTV-M3U-Manager/1.0' },
        signal: AbortSignal.timeout(30000),
      });
      if (rawResponse.ok) {
        content = await rawResponse.text();
      }
    }

    // Parse M3U
    const playlist = parseM3U(content);

    // Merge duplicates
    const { merged } = mergeChannels(playlist.channels);

    // Insert into database
    const inserted = await insertChannels(
      env,
      source_id,
      merged.map((ch) => ({
        name: ch.name,
        tvg_name: ch.tvg_name,
        tvg_id: ch.tvg_id,
        tvg_logo: ch.tvg_logo,
        group_title: ch.group_title,
        url: ch.url,
        tvg_chno: ch.tvg_chno,
      }))
    );

    // Update source sync time
    await env.DB.prepare(
      'UPDATE sources SET last_sync_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?'
    )
      .bind(source_id)
      .run();

    // Update task
    await env.DB.prepare(
      'UPDATE tasks SET status = \'completed\', result = ?, completed_at = datetime(\'now\') WHERE id = ?'
    )
      .bind(JSON.stringify({ inserted, total: merged.length }), taskId)
      .run();
  } catch (error) {
    await env.DB.prepare(
      'UPDATE tasks SET status = \'failed\', error = ?, completed_at = datetime(\'now\') WHERE id = ?'
    )
      .bind(String(error), taskId)
      .run();
    throw error;
  }
}

async function handleDetect(payload: DetectTaskPayload, env: Env): Promise<void> {
  // Placeholder for channel detection (FFmpeg WASM / connectivity check)
  console.log(`Detecting channel ${payload.channel_id}: ${payload.channel_url}`);
}

async function handleEpgSync(
  payload: { source_id: number; source_url: string },
  env: Env
): Promise<void> {
  console.log(`Syncing EPG source ${payload.source_id}: ${payload.source_url}`);
  // Placeholder for EPG sync implementation
}
