import { Hono } from 'hono';
import type { Env } from '../types';
import { listChannels } from '../handlers/channels';
import { applyFilters } from '../services/filter-engine';
import { generateM3U } from '../services/m3u-parser';
import { cacheGet, cacheSet } from '../utils/cache';
import { storageGet, storagePut } from '../utils/storage';

const m3u = new Hono<{ Bindings: Env }>();

m3u.get('/m3u/:slug', async (c) => {
  const slug = c.req.param('slug');

  // Check KV cache
  const cached = await cacheGet<string>(c.env, `m3u:${slug}`);
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}.m3u"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  // Check R2 storage
  const r2 = await storageGet(c.env, `m3u/${slug}.m3u`);
  if (r2) {
    const content = await r2.text();
    await cacheSet(c.env, `m3u:${slug}`, content, 300);
    return new Response(content, {
      headers: {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}.m3u"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  // Generate M3U from enabled channels
  const { data: channels } = await listChannels(c.env, { enabled_only: true, page_size: 10000 });

  // Apply filter rules
  const { results: filterRules } = await c.env.DB.prepare(
    'SELECT * FROM filter_rules WHERE enabled = 1'
  ).all();

  const filtered = applyFilters(channels, filterRules as any[]);

  // Convert to M3U format
  const m3uChannels = filtered.map((ch) => ({
    name: ch.name,
    tvg_id: ch.tvg_id,
    tvg_name: ch.tvg_name || ch.name,
    tvg_logo: ('logo' in ch) ? ch.logo : ('tvg_logo' in ch ? ch.tvg_logo : ''),
    tvg_chno: '',
    group_title: ('group' in ch) ? ch["group"] : ('group_title' in ch ? ch.group_title : ''),
    url: ch.url,
  }));

  const content = generateM3U(m3uChannels, slug);

  // Cache in KV and R2
  await Promise.all([
    cacheSet(c.env, `m3u:${slug}`, content, 300),
    storagePut(c.env, `m3u/${slug}.m3u`, content, 'application/x-mpegurl'),
  ]);

  return new Response(content, {
    headers: {
      'Content-Type': 'application/x-mpegurl; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.m3u"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
});

export default m3u;
