import { Hono } from 'hono';
import type { Env } from '../types';
import { isAuthenticated } from '../utils/auth';
import { listSources, getSource, createSource, updateSource, deleteSource } from '../handlers/sources';
import { listChannels, getChannel, updateChannel, deleteChannel, batchUpdateChannels } from '../handlers/channels';
import { listGroups, createGroup, updateGroup, deleteGroup } from '../handlers/groups';
import { listEpgSources, createEpgSource, deleteEpgSource, syncEpgSource } from '../handlers/epg';
import { parseM3U } from '../services/m3u-parser';
import { mergeChannels } from '../services/channel-merger';
import { applyFilters } from '../services/filter-engine';
import { cacheGet, cacheSet, cacheFlush } from '../utils/cache';

const api = new Hono<{ Bindings: Env }>();

// Auth middleware
api.use('*', async (c, next) => {
  const path = c.req.path;
  // Skip auth for health check
  if (path === '/api/health') return next();

  if (!isAuthenticated(c.req.raw, c.env)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  return next();
});

// Health check
api.get('/api/health', (c) => {
  return c.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// === Sources ===
api.get('/api/sources', async (c) => {
  const sources = await listSources(c.env);
  return c.json({ success: true, data: sources });
});

api.post('/api/sources', async (c) => {
  const body = await c.req.json<{ name: string; url: string; type: string; sync_interval?: number }>();
  const source = await createSource(c.env, body);

  return c.json({ success: true, data: source }, 201);
});

api.put('/api/sources/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const source = await updateSource(c.env, id, body);
  if (!source) return c.json({ success: false, error: 'Source not found' }, 404);
  return c.json({ success: true, data: source });
});

api.delete('/api/sources/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await deleteSource(c.env, id);
  if (!deleted) return c.json({ success: false, error: 'Source not found' }, 404);
  return c.json({ success: true });
});

api.post('/api/sources/:id/sync', async (c) => {
  const id = Number(c.req.param('id'));
  const source = await getSource(c.env, id);
  if (!source) return c.json({ success: false, error: 'Source not found' }, 404);

  // TODO: Implement sync directly without queue
  return c.json({ success: true, message: 'Sync triggered' });
});

// === Channels ===
api.get('/api/channels', async (c) => {
  const page = Number(c.req.query('page') || '1');
  const page_size = Number(c.req.query('page_size') || '50');
  const group = c.req.query('group');
  const source_id = c.req.query('source_id') ? Number(c.req.query('source_id')) : undefined;
  const search = c.req.query('search');

  const result = await listChannels(c.env, { page, page_size, group, source_id, search });
  return c.json({ success: true, ...result });
});

api.get('/api/channels/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const channel = await getChannel(c.env, id);
  if (!channel) return c.json({ success: false, error: 'Channel not found' }, 404);
  return c.json({ success: true, data: channel });
});

api.put('/api/channels/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const channel = await updateChannel(c.env, id, body);
  if (!channel) return c.json({ success: false, error: 'Channel not found' }, 404);
  return c.json({ success: true, data: channel });
});

api.delete('/api/channels/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await deleteChannel(c.env, id);
  if (!deleted) return c.json({ success: false, error: 'Channel not found' }, 404);
  return c.json({ success: true });
});

api.post('/api/channels/batch', async (c) => {
  const body = await c.req.json<{ ids: number[]; action: string; data?: Record<string, unknown> }>();
  if (body.action === 'update' && body.data) {
    await batchUpdateChannels(c.env, body.ids, body.data as { enabled?: number; group_title?: string });
  }
  return c.json({ success: true });
});

// === Groups ===
api.get('/api/groups', async (c) => {
  const groups = await listGroups(c.env);
  return c.json({ success: true, data: groups });
});

api.post('/api/groups', async (c) => {
  const body = await c.req.json<{ name: string; display_name: string; sort_order?: number }>();
  const group = await createGroup(c.env, body);
  return c.json({ success: true, data: group }, 201);
});

api.put('/api/groups/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json();
  const group = await updateGroup(c.env, id, body);
  if (!group) return c.json({ success: false, error: 'Group not found' }, 404);
  return c.json({ success: true, data: group });
});

api.delete('/api/groups/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await deleteGroup(c.env, id);
  if (!deleted) return c.json({ success: false, error: 'Group not found' }, 404);
  return c.json({ success: true });
});

// === EPG ===
api.get('/api/epg/sources', async (c) => {
  const sources = await listEpgSources(c.env);
  return c.json({ success: true, data: sources });
});

api.post('/api/epg/sources', async (c) => {
  const body = await c.req.json<{ name: string; url: string }>();
  const source = await createEpgSource(c.env, body);
  return c.json({ success: true, data: source }, 201);
});

api.delete('/api/epg/sources/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await deleteEpgSource(c.env, id);
  if (!deleted) return c.json({ success: false, error: 'EPG source not found' }, 404);
  return c.json({ success: true });
});

api.post('/api/epg/sync', async (c) => {
  const body = await c.req.json<{ source_id: number }>();
  const result = await syncEpgSource(c.env, body.source_id);
  return c.json(result);
});

// === Preview ===
api.get('/api/preview', async (c) => {
  // Check cache
  const cached = await cacheGet(c.env, 'preview');
  if (cached) return c.json({ success: true, data: cached, cached: true });

  // Get enabled channels
  const { data: channels } = await listChannels(c.env, { enabled_only: true, page_size: 10000 });

  // Apply filters
  const { results: filterRules } = await c.env.DB.prepare(
    'SELECT * FROM filter_rules WHERE enabled = 1'
  ).all();

  const filtered = applyFilters(channels, filterRules as any[]);

  // Group by group_title
  const grouped: Record<string, typeof filtered> = {};
  for (const ch of filtered) {
    const group = ch.group_title || 'Default';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(ch);
  }

  const preview = {
    total: channels.length,
    filtered: filtered.length,
    groups: Object.entries(grouped).map(([name, items]) => ({
      name,
      count: items.length,
      channels: items.slice(0, 10),
    })),
  };

  await cacheSet(c.env, 'preview', preview, 300);
  return c.json({ success: true, data: preview });
});

api.get('/api/preview/cache/refresh', async (c) => {
  await cacheFlush(c.env, 'preview');
  return c.json({ success: true, message: 'Preview cache refreshed' });
});

// === Tasks ===
api.get('/api/tasks', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50'
  ).all();
  return c.json({ success: true, data: results });
});

export default api;
