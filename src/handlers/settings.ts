import type { Env, AppSettings } from '../types';

export async function getSettings(env: Env): Promise<AppSettings> {
  const row = await env.DB.prepare('SELECT * FROM app_settings WHERE id = 1').first<AppSettings>();
  if (!row) {
    await env.DB.prepare('INSERT OR IGNORE INTO app_settings (id) VALUES (1)').run();
    return (await env.DB.prepare('SELECT * FROM app_settings WHERE id = 1').first<AppSettings>())!;
  }
  return row;
}

export async function updateLlmTextConfig(
  env: Env,
  config: { base_url: string; api_key: string; model: string }
): Promise<void> {
  await env.DB.prepare('UPDATE app_settings SET llm_text_json = ? WHERE id = 1')
    .bind(JSON.stringify(config))
    .run();
}

export async function updateLlmVisionConfig(
  env: Env,
  config: { base_url: string; api_key: string; model: string }
): Promise<void> {
  await env.DB.prepare('UPDATE app_settings SET llm_vision_json = ? WHERE id = 1')
    .bind(JSON.stringify(config))
    .run();
}

export async function updateAccessPassword(
  env: Env,
  enabled: boolean,
  passwordHash?: string
): Promise<void> {
  if (passwordHash) {
    await env.DB.prepare('UPDATE app_settings SET access_password_enabled = ?, access_password_hash = ? WHERE id = 1')
      .bind(enabled ? 1 : 0, passwordHash)
      .run();
  } else {
    await env.DB.prepare('UPDATE app_settings SET access_password_enabled = ? WHERE id = 1')
      .bind(enabled ? 1 : 0)
      .run();
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '***';
  return key.slice(0, 4) + '***' + key.slice(-4);
}

export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
