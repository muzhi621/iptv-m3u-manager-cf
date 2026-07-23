import type { Env, Subscription } from '../types';

export async function listSubscriptions(env: Env): Promise<Subscription[]> {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM subscriptions ORDER BY id').all<Subscription>();
    return results || [];
  } catch (error) {
    console.error('listSubscriptions error:', error);
    throw new Error(`Database error: ${(error as Error).message}`);
  }
}

export async function getSubscription(env: Env, id: number): Promise<Subscription | null> {
  return await env.DB.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(id).first<Subscription>() ?? null;
}

export async function createSubscription(
  env: Env,
  data: { name: string; url: string; user_agent?: string; headers?: string; auto_update_minutes?: number; epg_url?: string }
): Promise<Subscription> {
  const result = await env.DB.prepare(
    'INSERT INTO subscriptions (name, url, user_agent, headers, auto_update_minutes, epg_url) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(
      data.name,
      data.url,
      data.user_agent || 'AptvPlayer/1.4.1',
      data.headers || '{}',
      data.auto_update_minutes || 0,
      data.epg_url || ''
    )
    .run();

  return (await getSubscription(env, result.meta.last_row_id as number))!;
}

export async function updateSubscription(
  env: Env,
  id: number,
  data: Partial<Pick<Subscription, 'name' | 'url' | 'user_agent' | 'headers' | 'auto_update_minutes' | 'is_enabled' | 'epg_url' | 'last_updated' | 'last_update_status'>>
): Promise<Subscription | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return getSubscription(env, id);

  values.push(id);
  await env.DB.prepare(`UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getSubscription(env, id);
}

export async function deleteSubscription(env: Env, id: number): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM subscriptions WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

export async function getSubscriptionChannels(
  env: Env,
  subscriptionId: number
): Promise<Record<string, unknown>[]> {
  const { results } = await env.DB.prepare(
    'SELECT id, name, url, "group", logo, is_enabled FROM channels WHERE subscription_id = ? ORDER BY "group", name'
  ).bind(subscriptionId).all();
  return results;
}
