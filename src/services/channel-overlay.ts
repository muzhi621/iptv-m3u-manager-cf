// Channel Logo & tvg-name Overlay (同频道智能覆盖)
// Simplified for Cloudflare Workers - no HTTP logo reachability checks

import type { Channel } from '../types';

const NAME_CHAR_MAP: Record<string, string> = {
  '臺': '台', '亞': '亚', '際': '际', '聞': '闻',
  '歡': '欢', '樂': '乐', '精': '精', '採': '采',
  '視': '视', '廣': '广', '電': '电',
};

const NOISE_WORDS = ['4gtv', 'hd', 'fhd', 'sd', '字幕', '多音轨', '音轨', 'geo-blocked'];

// === Name Normalization ===

function normalizeChannelName(name: string): string {
  let n = name || '';
  // Remove prefix tags like [xxx]
  n = n.replace(/^\[[^\]]+\]/, '');
  // Remove content in brackets
  n = n.replace(/\[.*?\]|【.*?】|（.*?）|\(.*?\)/g, '');
  // Convert traditional to simplified
  for (const [trad, simp] of Object.entries(NAME_CHAR_MAP)) {
    n = n.replace(new RegExp(trad, 'g'), simp);
  }
  // Remove spaces and lowercase
  n = n.replace(/\s+/g, '').toLowerCase();
  // Remove noise words
  for (const word of NOISE_WORDS) {
    n = n.replace(new RegExp(word, 'gi'), '');
  }
  // Append 台 if ends with 新闻 but not 新闻台
  if (n.endsWith('新闻') && !n.endsWith('新闻台')) {
    n += '台';
  }
  return n;
}

function getChannelIdentity(ch: Channel): string {
  const tvgId = (ch.tvg_id || '').trim().toLowerCase();
  if (tvgId) return `tvg:${tvgId}`;
  const nameKey = normalizeChannelName(ch.name || ch.tvg_name || '');
  return nameKey ? `name:${nameKey}` : '';
}

// === Cluster Detection ===

export interface ChannelCluster {
  ids: number[];
  key: string;
}

export function findSameChannelClusters(channels: Channel[]): ChannelCluster[] {
  const byTvg = new Map<string, number[]>();
  const byTvgName = new Map<string, number[]>();
  const byName = new Map<string, number[]>();

  for (const ch of channels) {
    if (!ch.id) continue;

    const tvgId = (ch.tvg_id || '').trim().toLowerCase();
    if (tvgId) {
      if (!byTvg.has(tvgId)) byTvg.set(tvgId, []);
      byTvg.get(tvgId)!.push(ch.id);
    }

    const tvgName = (ch.tvg_name || '').trim().toLowerCase();
    if (tvgName) {
      if (!byTvgName.has(tvgName)) byTvgName.set(tvgName, []);
      byTvgName.get(tvgName)!.push(ch.id);
    }

    const nameKey = normalizeChannelName(ch.name || '');
    if (nameKey) {
      if (!byName.has(nameKey)) byName.set(nameKey, []);
      byName.get(nameKey)!.push(ch.id);
    }
  }

  // Merge clusters using Union-Find
  const parent = new Map<number, number>();

  function find(x: number): number {
    if (!parent.has(x)) parent.set(x, x);
    const px = parent.get(x)!;
    if (px !== x) parent.set(x, find(px));
    return parent.get(x)!;
  }

  function unite(a: number, b: number): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  }

  // Merge by tvg_id
  for (const ids of byTvg.values()) {
    if (ids.length >= 2) {
      for (let i = 1; i < ids.length; i++) unite(ids[0], ids[i]);
    }
  }

  // Merge by tvg_name
  for (const ids of byTvgName.values()) {
    if (ids.length >= 2) {
      for (let i = 1; i < ids.length; i++) unite(ids[0], ids[i]);
    }
  }

  // Merge by normalized name
  for (const ids of byName.values()) {
    if (ids.length >= 2) {
      for (let i = 1; i < ids.length; i++) unite(ids[0], ids[i]);
    }
  }

  // Collect clusters
  const buckets = new Map<number, number[]>();
  for (const cid of parent.keys()) {
    const root = find(cid);
    if (!buckets.has(root)) buckets.set(root, []);
    buckets.get(root)!.push(cid);
  }

  return Array.from(buckets.values())
    .filter((ids) => ids.length >= 2)
    .map((ids) => ({ ids: ids.sort((a, b) => a - b), key: `cluster:${ids[0]}` }));
}

// === Donor Selection ===

function getEffectiveTvgName(ch: Channel): string {
  return (ch.tvg_name || ch.name || '').trim();
}

function scoreDonor(ch: Channel, layoutOrder: Map<number, number>): number {
  let score = 0;
  // Prefer channels with tvg_name
  if (getEffectiveTvgName(ch)) score += 2;
  // Prefer channels with logo
  if (ch.logo) score += 2;
  // Prefer channels with tvg_id
  if (ch.tvg_id) score += 1;
  // Prefer earlier in layout
  const rank = layoutOrder.get(ch.id!) ?? ch.id!;
  return score * 10000 - rank;
}

function buildLayoutOrder(channelLayout: string): Map<number, number> {
  const order = new Map<number, number>();
  try {
    const layout = JSON.parse(channelLayout || '{}');
    let idx = 0;
    for (const group of layout.groups || []) {
      for (const cid of group.channel_ids || []) {
        const id = parseInt(cid);
        if (!isNaN(id) && !order.has(id)) {
          order.set(id, idx++);
        }
      }
    }
  } catch {
    // ignore
  }
  return order;
}

interface OverlayDonor {
  id: number;
  tvg_name: string;
  logo: string;
  source_name: string;
}

function pickClusterDonor(
  channels: Channel[],
  cluster: ChannelCluster,
  layoutOrder: Map<number, number>
): OverlayDonor | null {
  const members = cluster.ids
    .map((id) => channels.find((ch) => ch.id === id))
    .filter((ch): ch is Channel => !!ch);

  if (members.length === 0) return null;

  // Sort by score (highest first)
  members.sort((a, b) => scoreDonor(b, layoutOrder) - scoreDonor(a, layoutOrder));

  const best = members[0];
  return {
    id: best.id!,
    tvg_name: getEffectiveTvgName(best),
    logo: best.logo || '',
    source_name: best.name || '',
  };
}

// === Overlay Computation ===

export interface LogoOverlay {
  logo: string;
  source_id: number;
  source_name: string;
}

export interface TvgNameOverlay {
  tvg_name: string;
  source_id: number;
  source_name: string;
}

export function computeLogoOverlays(
  channels: Channel[],
  clusters: ChannelCluster[],
  channelLayout: string = '{}'
): Map<number, LogoOverlay> {
  const layoutOrder = buildLayoutOrder(channelLayout);
  const overlays = new Map<number, LogoOverlay>();

  for (const cluster of clusters) {
    const donor = pickClusterDonor(channels, cluster, layoutOrder);
    if (!donor || !donor.logo) continue;

    for (const cid of cluster.ids) {
      if (cid === donor.id) continue;
      const ch = channels.find((c) => c.id === cid);
      if (!ch) continue;

      // Only overlay if target has no logo
      if (!ch.logo) {
        overlays.set(cid, {
          logo: donor.logo,
          source_id: donor.id,
          source_name: donor.source_name,
        });
      }
    }
  }

  return overlays;
}

export function computeTvgNameOverlays(
  channels: Channel[],
  clusters: ChannelCluster[],
  channelLayout: string = '{}'
): Map<number, TvgNameOverlay> {
  const layoutOrder = buildLayoutOrder(channelLayout);
  const overlays = new Map<number, TvgNameOverlay>();

  for (const cluster of clusters) {
    const donor = pickClusterDonor(channels, cluster, layoutOrder);
    if (!donor || !donor.tvg_name) continue;

    for (const cid of cluster.ids) {
      if (cid === donor.id) continue;
      const ch = channels.find((c) => c.id === cid);
      if (!ch) continue;

      // Only overlay if target has no tvg_name
      if (!(ch.tvg_name || '').trim()) {
        overlays.set(cid, {
          tvg_name: donor.tvg_name,
          source_id: donor.id,
          source_name: donor.source_name,
        });
      }
    }
  }

  return overlays;
}

// === Apply Overlays to Channels ===

export function applyLogoOverlays(
  channels: Channel[],
  overlays: Map<number, LogoOverlay>
): Channel[] {
  return channels.map((ch) => {
    if (!ch.id) return ch;
    const overlay = overlays.get(ch.id);
    if (overlay) {
      return { ...ch, logo: overlay.logo };
    }
    return ch;
  });
}

export function applyTvgNameOverlays(
  channels: Channel[],
  overlays: Map<number, TvgNameOverlay>
): Channel[] {
  return channels.map((ch) => {
    if (!ch.id) return ch;
    const overlay = overlays.get(ch.id);
    if (overlay) {
      return { ...ch, tvg_name: overlay.tvg_name };
    }
    return ch;
  });
}

// === Combined Overlay (convenience function) ===

export function applyChannelOverlays(
  channels: Channel[],
  channelLayout: string = '{}'
): {
  channels: Channel[];
  stats: {
    total: number;
    logoOverlaid: number;
    tvgNameOverlaid: number;
    clusters: number;
  };
} {
  const clusters = findSameChannelClusters(channels);
  const logoOverlays = computeLogoOverlays(channels, clusters, channelLayout);
  const tvgNameOverlays = computeTvgNameOverlays(channels, clusters, channelLayout);

  let result = applyLogoOverlays(channels, logoOverlays);
  result = applyTvgNameOverlays(result, tvgNameOverlays);

  return {
    channels: result,
    stats: {
      total: channels.length,
      logoOverlaid: logoOverlays.size,
      tvgNameOverlaid: tvgNameOverlays.size,
      clusters: clusters.length,
    },
  };
}
