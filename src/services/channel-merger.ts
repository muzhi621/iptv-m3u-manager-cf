import type { M3UChannel } from '../types';

export interface MergeResult {
  merged: M3UChannel[];
  stats: {
    total: number;
    unique: number;
    duplicates: number;
  };
}

export function mergeChannels(allChannels: M3UChannel[]): MergeResult {
  const map = new Map<string, M3UChannel>();

  for (const ch of allChannels) {
    const key = normalizeKey(ch.tvg_name || ch.name);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, ch);
    } else {
      // Prefer channel with logo, or longer URL (more specific)
      const preferExisting =
        (existing.tvg_logo && !ch.tvg_logo) ||
        (existing.tvg_logo === ch.tvg_logo && existing.url.length > ch.url.length);

      if (!preferExisting) {
        map.set(key, ch);
      }
    }
  }

  const merged = Array.from(map.values());
  return {
    merged,
    stats: {
      total: allChannels.length,
      unique: merged.length,
      duplicates: allChannels.length - merged.length,
    },
  };
}

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-_]+/g, '')
    .replace(/[（(].*?[)）]/g, '')
    .trim();
}
