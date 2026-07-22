import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import api from './routes/api';
import m3u from './routes/m3u';
import auth from './routes/auth';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Cookie'],
  credentials: true,
}));

// Auth routes (login/logout don't need auth middleware)
app.route('/', auth);

// API routes (with auth middleware)
app.route('/', api);

// M3U export routes (public)
app.route('/', m3u);

// Fallback - return 404 for unknown routes
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Cron trigger - sync all enabled sources
    const { results: sources } = await env.DB.prepare(
      'SELECT * FROM sources WHERE enabled = 1'
    ).all();

    // Direct sync without queue (simple implementation)
    for (const source of sources) {
      console.log(`Syncing source: ${source.name} (${source.url})`);
      // TODO: Implement direct sync here
    }

    console.log(`Scheduled sync triggered for ${sources.length} sources`);
  },
};
