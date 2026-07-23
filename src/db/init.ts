// Auto-initialize D1 database on first request
import type { Env } from '../types';

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT 'AptvPlayer/1.4.1',
  headers TEXT NOT NULL DEFAULT '{}',
  last_updated TEXT,
  last_update_status TEXT NOT NULL DEFAULT '',
  auto_update_minutes INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  epg_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscription_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  "group" TEXT NOT NULL DEFAULT '',
  logo TEXT NOT NULL DEFAULT '',
  tvg_id TEXT NOT NULL DEFAULT '',
  tvg_name TEXT NOT NULL DEFAULT '',
  is_enabled INTEGER NOT NULL DEFAULT 1,
  check_status INTEGER NOT NULL DEFAULT 0,
  check_date TEXT,
  check_image TEXT NOT NULL DEFAULT '',
  check_error TEXT NOT NULL DEFAULT '',
  check_source TEXT NOT NULL DEFAULT '',
  ai_visual_status TEXT NOT NULL DEFAULT '',
  ai_visual_detail TEXT NOT NULL DEFAULT '',
  ai_visual_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS output_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  epg_url TEXT NOT NULL DEFAULT '',
  include_source_suffix INTEGER NOT NULL DEFAULT 0,
  filter_regex TEXT NOT NULL DEFAULT '.*',
  keywords TEXT NOT NULL DEFAULT '[]',
  subscription_ids TEXT NOT NULL DEFAULT '[]',
  excluded_channel_ids TEXT NOT NULL DEFAULT '[]',
  last_updated TEXT,
  last_update_status TEXT NOT NULL DEFAULT '',
  last_request_time TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  auto_update_minutes INTEGER NOT NULL DEFAULT 0,
  auto_visual_check INTEGER NOT NULL DEFAULT 0,
  auto_disable_on_check INTEGER NOT NULL DEFAULT 0,
  auto_ai_vision_check INTEGER NOT NULL DEFAULT 0,
  auto_ai_organize INTEGER NOT NULL DEFAULT 0,
  enable_ai_vision INTEGER NOT NULL DEFAULT 0,
  enable_ai_organize INTEGER NOT NULL DEFAULT 0,
  ai_organize_prompt TEXT NOT NULL DEFAULT '',
  ai_vision_prompt TEXT NOT NULL DEFAULT '',
  layout_mode TEXT NOT NULL DEFAULT 'rules',
  channel_layout TEXT NOT NULL DEFAULT '{}',
  layout_meta TEXT NOT NULL DEFAULT '{}',
  preview_cache_key TEXT NOT NULL DEFAULT '',
  preview_cache_json TEXT NOT NULL DEFAULT '',
  preview_cache_at TEXT,
  member_total INTEGER NOT NULL DEFAULT 0,
  member_enabled INTEGER NOT NULL DEFAULT 0,
  member_disabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  llm_text_json TEXT NOT NULL DEFAULT '{}',
  llm_vision_json TEXT NOT NULL DEFAULT '{}',
  access_password_enabled INTEGER NOT NULL DEFAULT 0,
  access_password_hash TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS task_records (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  result TEXT NOT NULL DEFAULT '{}',
  is_shown INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_channels_subscription ON channels(subscription_id);
CREATE INDEX IF NOT EXISTS idx_channels_group ON channels("group");
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(is_enabled);
CREATE INDEX IF NOT EXISTS idx_channels_tvg_name ON channels(tvg_name);
CREATE INDEX IF NOT EXISTS idx_output_sources_slug ON output_sources(slug);
CREATE INDEX IF NOT EXISTS idx_output_sources_enabled ON output_sources(is_enabled);
CREATE INDEX IF NOT EXISTS idx_task_records_status ON task_records(status);

INSERT OR IGNORE INTO app_settings (id) VALUES (1);
`;

let initialized = false;

export async function ensureDbInitialized(db: D1Database): Promise<void> {
  if (initialized) return;

  try {
    // Try a simple query to check if tables exist
    await db.prepare('SELECT 1 FROM subscriptions LIMIT 1').first();
    initialized = true;
    console.log('Database tables exist');
    return;
  } catch {
    // Tables don't exist, initialize them
  }

  try {
    console.log('Initializing database...');
    const statements = INIT_SQL.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await db.prepare(stmt).run();
      } catch (e) {
        const msg = (e as Error).message || '';
        if (!msg.includes('already exists')) {
          console.log('Statement error:', msg);
        }
      }
    }
    console.log('Database initialized successfully');
    initialized = true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Still mark as initialized to avoid repeated failures
    initialized = true;
  }
}
