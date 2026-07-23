import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import api from './routes/api';
import auth from './routes/auth';
import { INDEX_HTML } from './frontend/index';
import { handleWebSocketUpgrade, getConnectionCount } from './services/websocket';
import { ensureDbInitialized } from './db/init';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Cookie'],
  credentials: true,
}));

// Auto-initialize database on first request
app.use('*', async (c, next) => {
  await ensureDbInitialized(c.env.DB);
  return next();
});

// Serve frontend
app.get('/', (c) => {
  return c.html(INDEX_HTML);
});

// WebSocket endpoint
app.get('/ws', (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.json({ error: 'Expected WebSocket upgrade' }, 426);
  }
  return handleWebSocketUpgrade(c.req.raw, c.env);
});

// WebSocket status
app.get('/api/ws/status', (c) => {
  return c.json({ success: true, data: { connections: getConnectionCount() } });
});

// Auth routes
app.route('/', auth);

// API routes
app.route('/', api);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Cron trigger - auto-update subscriptions
    const { results: subs } = await env.DB.prepare(
      'SELECT * FROM subscriptions WHERE is_enabled = 1 AND auto_update_minutes > 0'
    ).all();

    for (const sub of subs) {
      if (sub.last_updated) {
        const lastUpdate = new Date(sub.last_updated).getTime();
        const interval = sub.auto_update_minutes * 60 * 1000;
        if (Date.now() - lastUpdate < interval) continue;
      }

      console.log(`Auto-syncing subscription: ${sub.name}`);
      // Trigger sync
      try {
        const response = await fetch(sub.url, {
          headers: { 'User-Agent': sub.user_agent || 'AptvPlayer/1.4.1' },
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) continue;

        const content = await response.text();
        const { parseM3U } = await import('./services/m3u-parser');
        const playlist = parseM3U(content);

        await env.DB.prepare('DELETE FROM channels WHERE subscription_id = ?').bind(sub.id).run();

        const BATCH_SIZE = 50;
        for (let i = 0; i < playlist.channels.length; i += BATCH_SIZE) {
          const batch = playlist.channels.slice(i, i + BATCH_SIZE);
          const stmts = batch.map((ch) =>
            env.DB.prepare(
              'INSERT INTO channels (subscription_id, name, url, "group", logo, tvg_id, tvg_name) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(sub.id, ch.name, ch.url, ch.group_title, ch.tvg_logo, ch.tvg_id, ch.tvg_name)
          );
          await env.DB.batch(stmts);
        }

        await env.DB.prepare(
          'UPDATE subscriptions SET last_updated = datetime(\'now\'), last_update_status = ? WHERE id = ?'
        ).bind(`Success (${playlist.channels.length} channels)`, sub.id).run();
      } catch (error) {
        console.error(`Sync failed for ${sub.name}:`, error);
      }
    }

    console.log(`Scheduled sync completed for ${subs.length} subscriptions`);
  },
};
