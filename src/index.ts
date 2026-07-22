import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import api from './routes/api';
import m3u from './routes/m3u';
import auth from './routes/auth';
import { handleQueueMessage } from './queue/handler';

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

// Fallback - serve frontend assets
app.get('*', async (c) => {
  // Try to serve static assets from Workers Assets
  const assetResponse = await c.env.ASSETS.fetch(c.req.raw);
  if (assetResponse.status === 200) return assetResponse;

  // Fallback to index.html for SPA routing
  const indexResponse = await c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
  if (indexResponse.status === 200) return indexResponse;

  return c.json({ success: false, error: 'Not found' }, 404);
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  async queue(batch: MessageBatch<unknown>, env: Env, ctx: ExecutionContext): Promise<void> {
    for (const message of batch.messages) {
      try {
        await handleQueueMessage(message, env);
        message.ack();
      } catch (error) {
        console.error('Queue message failed:', error);
        message.retry();
      }
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Cron trigger - sync all enabled sources
    const { results: sources } = await env.DB.prepare(
      'SELECT * FROM sources WHERE enabled = 1'
    ).all();

    for (const source of sources) {
      await env.TASK_QUEUE.send({
        type: 'sync',
        source_id: source.id,
        source_url: source.url,
        source_type: source.type,
      });
    }

    console.log(`Scheduled sync triggered for ${sources.length} sources`);
  },
};
