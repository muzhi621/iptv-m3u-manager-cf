import type { Env } from '../types';
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
      await handleSync(payload as { subscription_id: number; subscription_url: string }, env);
      break;
    case 'detect':
      console.log('Detect task received');
      break;
    case 'epg_sync':
      console.log('EPG sync task received');
      break;
    default:
      console.error(`Unknown task type: ${payload.type}`);
  }
}

async function handleSync(payload: { subscription_id: number; subscription_url: string }, env: Env): Promise<void> {
  const { subscription_id, subscription_url } = payload;

  try {
    const response = await fetch(subscription_url, {
      headers: { 'User-Agent': 'IPTV-M3U-Manager/1.0' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const content = await response.text();
    const playlist = parseM3U(content);
    const { merged } = mergeChannels(playlist.channels);

    await insertChannels(
      env,
      subscription_id,
      merged.map((ch) => ({
        name: ch.name,
        tvg_name: ch.tvg_name,
        tvg_id: ch.tvg_id,
        logo: ch.tvg_logo,
        group: ch.group_title,
        url: ch.url,
      }))
    );

    await env.DB.prepare(
      'UPDATE subscriptions SET last_updated = datetime(\'now\'), last_update_status = ? WHERE id = ?'
    )
      .bind(`Success (${merged.length} channels)`, subscription_id)
      .run();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await env.DB.prepare(
      'UPDATE subscriptions SET last_update_status = ? WHERE id = ?'
    )
      .bind(msg, subscription_id)
      .run();
    throw error;
  }
}
