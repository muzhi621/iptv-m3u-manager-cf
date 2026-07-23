import { Hono } from 'hono';
import type { Env } from '../types';
import { isAuthenticated } from '../utils/auth';
import { listSubscriptions, getSubscription, createSubscription, updateSubscription, deleteSubscription, getSubscriptionChannels } from '../handlers/subscriptions';
import { listOutputSources, getOutputSource, createOutputSource, updateOutputSource, deleteOutputSource, aggregateChannels, filterChannels, updateMemberStats } from '../handlers/outputs';
import { getSettings, updateLlmTextConfig, updateLlmVisionConfig, updateAccessPassword, maskApiKey } from '../handlers/settings';
import { listTasks, getTask, createTask, updateTask, deleteTask, cleanupTasks } from '../handlers/tasks';
import { getCurrentProgram, batchMatchEpg, syncEpgSources, getEpgSourcesInfo } from '../handlers/epg';
import { parseM3U, generateM3U } from '../services/m3u-parser';
import { cacheGet, cacheSet, cacheFlush } from '../utils/cache';
import { checkUrl } from '../services/connectivity';
import { aiGroup, aiSort, aiVisionCheck } from '../handlers/ai';

const api = new Hono<{ Bindings: Env }>();

// Auth middleware
api.use('*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api/health' || path === '/api/auth/login' || path === '/api/auth/status') return next();

  if (!isAuthenticated(c.req.raw, c.env)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  return next();
});

// Health check
api.get('/api/health', (c) => {
  return c.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// === Settings ===
api.get('/api/settings/llm', async (c) => {
  const settings = await getSettings(c.env);
  const textConfig = JSON.parse(settings.llm_text_json || '{}');
  const visionConfig = JSON.parse(settings.llm_vision_json || '{}');
  return c.json({
    success: true,
    data: {
      text: { base_url: textConfig.base_url || '', api_key: maskApiKey(textConfig.api_key || ''), model: textConfig.model || '' },
      vision: { base_url: visionConfig.base_url || '', api_key: maskApiKey(visionConfig.api_key || ''), model: visionConfig.model || '' },
    },
  });
});

api.put('/api/settings/llm', async (c) => {
  const body = await c.req.json<{ text?: { base_url: string; api_key: string; model: string }; vision?: { base_url: string; api_key: string; model: string } }>();
  if (body.text) await updateLlmTextConfig(c.env, body.text);
  if (body.vision) await updateLlmVisionConfig(c.env, body.vision);
  return c.json({ success: true });
});

api.get('/api/settings/access', async (c) => {
  const settings = await getSettings(c.env);
  return c.json({
    success: true,
    data: { enabled: !!settings.access_password_enabled },
  });
});

api.put('/api/settings/access', async (c) => {
  const body = await c.req.json<{ enabled: boolean; password?: string }>();
  if (body.password) {
    // Simple hash for now - in production use PBKDF2
    let hash = 0;
    for (let i = 0; i < body.password.length; i++) {
      hash = ((hash << 5) - hash + body.password.charCodeAt(i)) | 0;
    }
    await updateAccessPassword(c.env, body.enabled, Math.abs(hash).toString(36));
  } else {
    await updateAccessPassword(c.env, body.enabled);
  }
  return c.json({ success: true });
});

// === Subscriptions ===
api.get('/subscriptions', async (c) => {
  const subs = await listSubscriptions(c.env);
  return c.json({ success: true, data: subs });
});

api.post('/subscriptions', async (c) => {
  const body = await c.req.json<{ name: string; url: string; user_agent?: string; headers?: string; auto_update_minutes?: number; epg_url?: string }>();
  const sub = await createSubscription(c.env, body);
  return c.json({ success: true, data: sub }, 201);
});

api.put('/subscriptions/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const sub = await updateSubscription(c.env, id, body);
  if (!sub) return c.json({ success: false, error: 'Subscription not found' }, 404);
  return c.json({ success: true, data: sub });
});

api.delete('/subscriptions/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await deleteSubscription(c.env, id);
  if (!deleted) return c.json({ success: false, error: 'Subscription not found' }, 404);
  return c.json({ success: true });
});

api.get('/subscriptions/:id/channels', async (c) => {
  const id = Number(c.req.param('id'));
  const channels = await getSubscriptionChannels(c.env, id);
  return c.json({ success: true, data: channels });
});

api.post('/subscriptions/:id/refresh', async (c) => {
  const id = Number(c.req.param('id'));
  const sub = await getSubscription(c.env, id);
  if (!sub) return c.json({ success: false, error: 'Subscription not found' }, 404);

  const taskId = `sync-${id}-${Date.now()}`;
  await createTask(c.env, taskId, `同步订阅: ${sub.name}`);

  // Trigger sync via fetch (simplified - in production use Queues)
  try {
    await updateTask(c.env, taskId, { status: 'running', progress: 10, message: '正在抓取...' });

    const response = await fetch(sub.url, {
      headers: { 'User-Agent': sub.user_agent || 'AptvPlayer/1.4.1' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const content = await response.text();
    const playlist = parseM3U(content);

    // Delete old channels
    await c.env.DB.prepare('DELETE FROM channels WHERE subscription_id = ?').bind(id).run();

    // Insert new channels
    const BATCH_SIZE = 50;
    for (let i = 0; i < playlist.channels.length; i += BATCH_SIZE) {
      const batch = playlist.channels.slice(i, i + BATCH_SIZE);
      const stmts = batch.map((ch) =>
        c.env.DB.prepare(
          'INSERT INTO channels (subscription_id, name, url, "group", logo, tvg_id, tvg_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, ch.name, ch.url, ch.group_title, ch.tvg_logo, ch.tvg_id, ch.tvg_name)
      );
      await c.env.DB.batch(stmts);
    }

    // Update subscription status
    await updateSubscription(c.env, id, {
      last_updated: new Date().toISOString(),
      last_update_status: `Success (${playlist.channels.length} channels)`,
    });

    await updateTask(c.env, taskId, {
      status: 'success',
      progress: 100,
      message: `同步完成: ${playlist.channels.length} 个频道`,
      result: JSON.stringify({ channel_count: playlist.channels.length }),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await updateSubscription(c.env, id, { last_update_status: errorMsg });
    await updateTask(c.env, taskId, { status: 'failure', message: errorMsg });
  }

  return c.json({ success: true, task_id: taskId });
});

// === Output Sources ===
api.get('/outputs', async (c) => {
  const outputs = await listOutputSources(c.env);
  return c.json({ success: true, data: outputs });
});

api.post('/outputs', async (c) => {
  const body = await c.req.json();
  const output = await createOutputSource(c.env, body);
  return c.json({ success: true, data: output }, 201);
});

api.get('/outputs/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const output = await getOutputSource(c.env, id);
  if (!output) return c.json({ success: false, error: 'Output source not found' }, 404);
  return c.json({ success: true, data: output });
});

api.put('/outputs/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const output = await updateOutputSource(c.env, id, body);
  if (!output) return c.json({ success: false, error: 'Output source not found' }, 404);
  return c.json({ success: true, data: output });
});

api.delete('/outputs/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await deleteOutputSource(c.env, id);
  if (!deleted) return c.json({ success: false, error: 'Output source not found' }, 404);
  return c.json({ success: true });
});

api.get('/outputs/source-groups', async (c) => {
  const subIdsParam = c.req.query('subscription_ids');
  if (!subIdsParam) return c.json({ success: true, data: [] });

  const subIds = subIdsParam.split(',').map(Number);
  const placeholders = subIds.map(() => '?').join(',');
  const { results } = await c.env.DB.prepare(
    `SELECT "group", COUNT(*) as count FROM channels WHERE subscription_id IN (${placeholders}) GROUP BY "group" ORDER BY count DESC`
  ).bind(...subIds).all();

  return c.json({ success: true, data: results });
});

api.get('/outputs/:id/export-preview', async (c) => {
  const id = Number(c.req.param('id'));
  const output = await getOutputSource(c.env, id);
  if (!output) return c.json({ success: false, error: 'Output source not found' }, 404);

  // Check cache
  const cacheKey = `preview:${id}`;
  const cached = await cacheGet(c.env, cacheKey);
  if (cached) return c.json({ success: true, data: cached, cached: true });

  // Build preview
  const allChannels = await aggregateChannels(c.env, output);
  const filtered = await filterChannels(allChannels, output);

  // Group by group title
  const groups: Record<string, typeof filtered> = {};
  for (const ch of filtered) {
    const group = ch["group"] || 'Default';
    if (!groups[group]) groups[group] = [];
    groups[group].push(ch);
  }

  const preview = {
    total: allChannels.length,
    filtered: filtered.length,
    groups: Object.entries(groups).map(([name, items]) => ({
      name,
      count: items.length,
      channels: items.map((ch) => ({
        id: ch.id,
        name: ch.name,
        url: ch.url,
        group: ch["group"],
        logo: ch.logo,
        tvg_name: ch.tvg_name,
        is_enabled: ch.is_enabled,
      })),
    })),
  };

  await cacheSet(c.env, cacheKey, preview, 300);
  return c.json({ success: true, data: preview });
});

api.post('/outputs/:id/refresh', async (c) => {
  const id = Number(c.req.param('id'));
  const output = await getOutputSource(c.env, id);
  if (!output) return c.json({ success: false, error: 'Output source not found' }, 404);

  // Update member stats
  await updateMemberStats(c.env, id);

  // Clear cache
  await cacheFlush(c.env, `preview:${id}`);

  return c.json({ success: true });
});

api.post('/outputs/:id/layout-mode', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ mode: string }>();
  const output = await updateOutputSource(c.env, id, { layout_mode: body.mode });
  if (!output) return c.json({ success: false, error: 'Output source not found' }, 404);
  return c.json({ success: true, data: output });
});

// === M3U Export (Public) ===
api.get('/m3u/:slug', async (c) => {
  const slug = c.req.param('slug');

  const output = await getOutputSourceBySlug(c.env, slug);
  if (!output) return c.json({ success: false, error: 'Not found' }, 404);

  // Update last request time
  await updateOutputSource(c.env, output.id, { last_request_time: new Date().toISOString() });

  // Check cache
  const cacheKey = `m3u:${slug}`;
  const cached = await cacheGet<string>(c.env, cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}.m3u"`,
      },
    });
  }

  // Generate M3U
  const allChannels = await aggregateChannels(c.env, output);
  const filtered = await filterChannels(allChannels, output);

  const m3uChannels = filtered.map((ch) => ({
    name: ch.name,
    tvg_id: ch.tvg_id,
    tvg_name: ch.tvg_name || ch.name,
    tvg_logo: ch.logo,
    tvg_chno: '',
    group_title: ch["group"],
    url: ch.url,
  }));

  const content = generateM3U(m3uChannels, slug);

  // Cache
  await cacheSet(c.env, cacheKey, content, 300);

  return new Response(content, {
    headers: {
      'Content-Type': 'application/x-mpegurl; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.m3u"`,
    },
  });
});

// === EPG ===
api.get('/api/epg/current/:channelId', async (c) => {
  const channelId = Number(c.req.param('channelId'));
  const program = await getCurrentProgram(c.env, channelId);
  return c.json({ success: true, data: program });
});

api.post('/api/epg/batch', async (c) => {
  const body = await c.req.json<{ channel_ids: number[] }>();
  const result = await batchMatchEpg(c.env, body.channel_ids);
  return c.json({ success: true, data: result });
});

api.get('/api/epg/sources', async (c) => {
  const sources = await getEpgSourcesInfo(c.env);
  return c.json({ success: true, data: sources });
});

api.post('/api/epg/sync', async (c) => {
  const body = await c.req.json<{ output_id: number }>();
  const result = await syncEpgSources(c.env, body.output_id);
  return c.json(result);
});

// === Tools ===
api.post('/check-connectivity', async (c) => {
  const body = await c.req.json<{ url: string }>();
  const result = await checkUrl(body.url);
  return c.json({ success: true, data: result });
});

api.post('/channels/:id/toggle', async (c) => {
  const id = Number(c.req.param('id'));
  const channel = await c.env.DB.prepare('SELECT id, is_enabled FROM channels WHERE id = ?')
    .bind(id).first<{ id: number; is_enabled: number }>();

  if (!channel) return c.json({ success: false, error: 'Channel not found' }, 404);

  await c.env.DB.prepare('UPDATE channels SET is_enabled = ? WHERE id = ?')
    .bind(channel.is_enabled ? 0 : 1, id)
    .run();

  return c.json({ success: true, data: { id, is_enabled: !channel.is_enabled } });
});

// === Tasks ===
api.get('/api/tasks', async (c) => {
  const tasks = await listTasks(c.env);
  return c.json({ success: true, data: tasks });
});

api.post('/api/tasks/:id/stop', async (c) => {
  const id = c.req.param('id');
  await updateTask(c.env, id, { status: 'canceled' });
  return c.json({ success: true });
});

api.delete('/api/tasks/cleanup', async (c) => {
  const count = await cleanupTasks(c.env);
  return c.json({ success: true, data: { deleted: count } });
});

// === Preview ===
api.get('/api/preview', async (c) => {
  const outputs = await listOutputSources(c.env);
  const preview = outputs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    member_total: o.member_total,
    member_enabled: o.member_enabled,
    member_disabled: o.member_disabled,
    last_updated: o.last_updated,
    is_enabled: o.is_enabled,
  }));
  return c.json({ success: true, data: preview });
});

api.get('/api/preview/cache/refresh', async (c) => {
  await cacheFlush(c.env, 'preview:');
  await cacheFlush(c.env, 'm3u:');
  return c.json({ success: true, message: 'Cache refreshed' });
});

// === AI ===
api.post('/api/ai/group', async (c) => {
  const body = await c.req.json<{ output_id: number; prompt?: string }>();
  const result = await aiGroup(c.env, body.output_id, body.prompt);
  return c.json(result);
});

api.post('/api/ai/sort', async (c) => {
  const body = await c.req.json<{ output_id: number; prompt?: string }>();
  const result = await aiSort(c.env, body.output_id, body.prompt);
  return c.json(result);
});

api.post('/api/ai/detect', async (c) => {
  const body = await c.req.json<{ output_id: number; channel_ids?: number[] }>();
  const result = await aiVisionCheck(c.env, body.output_id, body.channel_ids);
  return c.json(result);
});

export default api;
