export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  STORAGE: R2Bucket;
  ADMIN_PASSWORD: string;
  COOKIE_SECRET: string;
  DEFAULT_SOURCES?: string;
  AI_PROMPT_PREFIX?: string;
  FFMPEG_TIMEOUT?: string;
}

// === Database Models ===

export interface Subscription {
  id: number;
  name: string;
  url: string;
  user_agent: string;
  headers: string;
  last_updated: string | null;
  last_update_status: string;
  auto_update_minutes: number;
  is_enabled: number;
  epg_url: string;
  created_at: string;
}

export interface Channel {
  id: number;
  subscription_id: number;
  name: string;
  url: string;
  "group": string;
  logo: string;
  tvg_id: string;
  tvg_name: string;
  is_enabled: number;
  check_status: number;
  check_date: string | null;
  check_image: string;
  check_error: string;
  check_source: string;
  ai_visual_status: string;
  ai_visual_detail: string;
  ai_visual_date: string | null;
  created_at: string;
}

export interface OutputSource {
  id: number;
  name: string;
  slug: string;
  epg_url: string;
  include_source_suffix: number;
  filter_regex: string;
  keywords: string;
  subscription_ids: string;
  excluded_channel_ids: string;
  last_updated: string | null;
  last_update_status: string;
  last_request_time: string | null;
  is_enabled: number;
  auto_update_minutes: number;
  auto_visual_check: number;
  auto_disable_on_check: number;
  auto_ai_vision_check: number;
  auto_ai_organize: number;
  enable_ai_vision: number;
  enable_ai_organize: number;
  ai_organize_prompt: string;
  ai_vision_prompt: string;
  layout_mode: string;
  channel_layout: string;
  layout_meta: string;
  preview_cache_key: string;
  preview_cache_json: string;
  preview_cache_at: string | null;
  member_total: number;
  member_enabled: number;
  member_disabled: number;
  created_at: string;
}

export interface AppSettings {
  id: number;
  llm_text_json: string;
  llm_vision_json: string;
  access_password_enabled: number;
  access_password_hash: string;
}

export interface TaskRecord {
  id: string;
  name: string;
  status: string;
  progress: number;
  message: string;
  created_at: string;
  updated_at: string;
  result: string;
  is_shown: number;
}

export interface EpgSource {
  id: number;
  name: string;
  url: string;
  enabled: number;
  last_sync_at: string | null;
  created_at: string;
}

// === M3U Types ===

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

// === API Types ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// === Task Queue Types ===

export interface SyncTaskPayload {
  subscription_id: number;
  subscription_url: string;
}

export interface DetectTaskPayload {
  channel_id: number;
  channel_url: string;
}

// === Keyword Rule ===

export interface KeywordRule {
  value: string;
  group: string;
  match_by: "name" | "source_group";
}

// === Filter Rule ===

export interface FilterRule {
  id: number;
  name: string;
  type: 'include' | 'exclude';
  pattern: string;
  is_regex: boolean;
  enabled: boolean;
  target: 'name' | 'group' | 'url';
}

// === Source (alias for Subscription) ===
export type Source = Subscription;

// === Group ===
export interface Group {
  id: number;
  name: string;
  display_name: string;
  channels: number[];
  is_system: boolean;
}
