-- IPTV M3U Manager - D1 Schema

-- 订阅源
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'm3u' CHECK(type IN ('m3u', 'txt', 'github')),
  enabled INTEGER NOT NULL DEFAULT 1,
  sync_interval INTEGER NOT NULL DEFAULT 3600,
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 频道
CREATE TABLE IF NOT EXISTS channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  tvg_name TEXT NOT NULL DEFAULT '',
  tvg_id TEXT NOT NULL DEFAULT '',
  tvg_logo TEXT NOT NULL DEFAULT '',
  group_title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  tvg_chno TEXT NOT NULL DEFAULT '',
  enabled INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK(status IN ('unknown', 'ok', 'error')),
  last_check_at TEXT,
  screenshot_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- 分组
CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  auto_created INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 筛选规则
CREATE TABLE IF NOT EXISTS filter_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('include', 'exclude')),
  pattern TEXT NOT NULL,
  is_regex INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  target TEXT NOT NULL DEFAULT 'name' CHECK(target IN ('name', 'group', 'url')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 系统配置
CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 任务记录
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  params TEXT NOT NULL DEFAULT '{}',
  result TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  started_at TEXT,
  completed_at TEXT
);

-- EPG 源
CREATE TABLE IF NOT EXISTS epg_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_sync_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_channels_source ON channels(source_id);
CREATE INDEX IF NOT EXISTS idx_channels_group ON channels(group_title);
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channels_enabled ON channels(enabled);
CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
