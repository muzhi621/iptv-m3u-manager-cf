export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ASSETS: { fetch: FetchFunction };
  ADMIN_PASSWORD: string;
  COOKIE_SECRET: string;
  DEFAULT_SOURCES?: string;
  AI_PROMPT_PREFIX?: string;
  FFMPEG_TIMEOUT?: string;
}

export interface FetchFunction {
  fetch(request: Request): Promise<Response>;
}

// Database models
export interface Source {
  id: number;
  name: string;
  url: string;
  type: 'm3u' | 'txt' | 'github';
  enabled: number;
  sync_interval: number;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: number;
  source_id: number;
  name: string;
  tvg_name: string;
  tvg_id: string;
  tvg_logo: string;
  group_title: string;
  url: string;
  tvg_chno: string;
  enabled: number;
  status: 'unknown' | 'ok' | 'error';
  last_check_at: string | null;
  screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  display_name: string;
  sort_order: number;
  auto_created: number;
  created_at: string;
}

export interface FilterRule {
  id: number;
  name: string;
  type: 'include' | 'exclude';
  pattern: string;
  is_regex: number;
  enabled: number;
  target: 'name' | 'group' | 'url';
  created_at: string;
}

export interface Task {
  id: number;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  params: string;
  result: string | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface EpgSource {
  id: number;
  name: string;
  url: string;
  enabled: number;
  last_sync_at: string | null;
  created_at: string;
}

export interface SystemConfig {
  key: string;
  value: string;
}

// M3U types
export interface M3UChannel {
  name: string;
  tvg_id: string;
  tvg_name: string;
  tvg_logo: string;
  tvg_chno: string;
  group_title: string;
  url: string;
}

export interface M3UPlaylist {
  channels: M3UChannel[];
  raw: string;
}

// API types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Task queue types
export interface SyncTaskPayload {
  source_id: number;
  source_url: string;
  source_type: 'm3u' | 'txt' | 'github';
}

export interface DetectTaskPayload {
  channel_id: number;
  channel_url: string;
}

export interface SnapshotTaskPayload {
  channel_id: number;
  channel_url: string;
}
