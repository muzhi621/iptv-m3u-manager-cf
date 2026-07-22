import type { Env, OutputSource, Channel } from '../types';

export async function listOutputSources(env: Env): Promise<OutputSource[]> {
  const { results } = await env.DB.prepare('SELECT * FROM output_sources ORDER BY id').all<OutputSource>();
  return results;
}

export async function getOutputSource(env: Env, id: number): Promise<OutputSource | null> {
  return await env.DB.prepare('SELECT * FROM output_sources WHERE id = ?').bind(id).first<OutputSource>() ?? null;
}

export async function getOutputSourceBySlug(env: Env, slug: string): Promise<OutputSource | null> {
  return await env.DB.prepare('SELECT * FROM output_sources WHERE slug = ?').bind(slug).first<OutputSource>() ?? null;
}

export async function createOutputSource(
  env: Env,
  data: Partial<OutputSource>
): Promise<OutputSource> {
  const result = await env.DB.prepare(
    `INSERT INTO output_sources (name, slug, epg_url, include_source_suffix, filter_regex, keywords, subscription_ids, excluded_channel_ids, auto_update_minutes, auto_visual_check, auto_disable_on_check, auto_ai_vision_check, auto_ai_organize, ai_organize_prompt, ai_vision_prompt, layout_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      data.name || '',
      data.slug || generateSlug(data.name || ''),
      data.epg_url || '',
      data.include_source_suffix || 0,
      data.filter_regex || '.*',
      data.keywords || '[]',
      data.subscription_ids || '[]',
      data.excluded_channel_ids || '[]',
      data.auto_update_minutes || 0,
      data.auto_visual_check || 0,
      data.auto_disable_on_check || 0,
      data.auto_ai_vision_check || 0,
      data.auto_ai_organize || 0,
      data.ai_organize_prompt || '',
      data.ai_vision_prompt || '',
      data.layout_mode || 'rules'
    )
    .run();

  return (await getOutputSource(env, result.meta.last_row_id as number))!;
}

export async function updateOutputSource(
  env: Env,
  id: number,
  data: Partial<OutputSource>
): Promise<OutputSource | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && key !== 'id' && key !== 'created_at') {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return getOutputSource(env, id);

  values.push(id);
  await env.DB.prepare(`UPDATE output_sources SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return getOutputSource(env, id);
}

export async function deleteOutputSource(env: Env, id: number): Promise<boolean> {
  const result = await env.DB.prepare('DELETE FROM output_sources WHERE id = ?').bind(id).run();
  return result.meta.changes > 0;
}

export async function aggregateChannels(
  env: Env,
  outputSource: OutputSource
): Promise<Channel[]> {
  const subIds: number[] = JSON.parse(outputSource.subscription_ids || '[]');
  if (subIds.length === 0) return [];

  const placeholders = subIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(
    `SELECT * FROM channels WHERE subscription_id IN (${placeholders}) ORDER BY "group", name`
  ).bind(...subIds).all<Channel>();

  return results;
}

export async function filterChannels(
  channels: Channel[],
  outputSource: OutputSource
): Promise<Channel[]> {
  const excludedIds: number[] = JSON.parse(outputSource.excluded_channel_ids || '[]');
  const keywords = JSON.parse(outputSource.keywords || '[]');
  const regex = outputSource.filter_regex || '.*';

  return channels.filter((ch) => {
    if (!ch.is_enabled) return false;
    if (excludedIds.includes(ch.id)) return false;

    // Regex filter
    try {
      const re = new RegExp(regex, 'i');
      if (!re.test(ch.name) && !re.test(ch.url) && !re.test(ch.tvg_name)) return false;
    } catch {
      // Invalid regex, skip
    }

    // Keyword rules (if any)
    if (keywords.length > 0) {
      const matchAny = keywords.some((rule: { value: string; match_by: string }) => {
        const target = rule.match_by === 'source_group' ? ch["group"] : ch.name;
        return target.toLowerCase().includes(rule.value.toLowerCase());
      });
      if (!matchAny) return false;
    }

    return true;
  });
}

export async function updateMemberStats(env: Env, outputId: number): Promise<void> {
  const output = await getOutputSource(env, outputId);
  if (!output) return;

  const channels = await aggregateChannels(env, output);
  const filtered = await filterChannels(channels, output);

  await env.DB.prepare(
    'UPDATE output_sources SET member_total = ?, member_enabled = ?, member_disabled = ? WHERE id = ?'
  )
    .bind(channels.length, filtered.length, channels.length - filtered.length, outputId)
    .run();
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
    || `output-${Date.now()}`;
}
