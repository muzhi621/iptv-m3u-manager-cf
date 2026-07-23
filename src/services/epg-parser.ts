// EPG XMLTV Parser for Cloudflare Workers
// Supports multi-source EPG, fuzzy matching, simplified/traditional Chinese

export interface EpgProgram {
  start: Date;
  end: Date;
  title: string;
}

export interface EpgChannel {
  id: string;
  displayNames: string[];
  icon?: string;
}

export interface EpgData {
  channels: Map<string, EpgChannel>;
  programs: Map<string, EpgProgram[]>;
  nameMap: Map<string, string>; // cleaned name -> channel id
  logos: Map<string, string>;  // channel id -> icon url
}

// === XML Parsing (lightweight, no DOM required) ===

function parseXmltv(xml: string): EpgData {
  const channels = new Map<string, EpgChannel>();
  const programs = new Map<string, EpgProgram[]>();
  const nameMap = new Map<string, string>();
  const logos = new Map<string, string>();

  // Parse channels
  const channelRegex = /<channel\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/channel>/g;
  let match;
  while ((match = channelRegex.exec(xml)) !== null) {
    const [, id, content] = match;
    const displayNames: string[] = [];
    const dnRegex = /<display-name[^>]*>([^<]*)<\/display-name>/g;
    let dnMatch;
    while ((dnMatch = dnRegex.exec(content)) !== null) {
      if (dnMatch[1]) displayNames.push(dnMatch[1].trim());
    }

    const iconMatch = content.match(/<icon\s+src="([^"]*)"/);
    const icon = iconMatch ? iconMatch[1] : undefined;

    channels.set(id, { id, displayNames, icon });
    if (icon) logos.set(id, icon);

    // Build name map with variants
    for (const name of displayNames) {
      nameMap.set(name, id);
      nameMap.set(cleanName(name), id);
      nameMap.set(toSimplified(name), id);
      nameMap.set(toTraditional(name), id);
    }
  }

  // Parse programmes
  const progRegex = /<programme\s+([^>]*)>/g;
  while ((match = progRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const channel = extractAttr(attrs, 'channel');
    const startStr = extractAttr(attrs, 'start');
    const stopStr = extractAttr(attrs, 'stop');

    if (!channel || !startStr || !stopStr) continue;

    const titleMatch = match[0].match(/<title[^>]*>([^<]*)<\/title>/) ||
      xml.substring(match.index, match.index + 500).match(/<title[^>]*>([^<]*)<\/title>/);

    const title = titleMatch ? titleMatch[1].trim() : '未知节目';

    const start = parseXmltvDate(startStr);
    const end = parseXmltvDate(stopStr);

    if (!start || !end) continue;

    if (!programs.has(channel)) programs.set(channel, []);
    programs.get(channel)!.push({ start, end, title });
  }

  // Sort programs by start time
  for (const progs of programs.values()) {
    progs.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  return { channels, programs, nameMap, logos };
}

function extractAttr(attrs: string, name: string): string | null {
  const regex = new RegExp(`${name}="([^"]*)"`);
  const match = attrs.match(regex);
  return match ? match[1] : null;
}

function parseXmltvDate(str: string): Date | null {
  // Format: 20240101120000 +0800 or 20240101120000
  try {
    const clean = str.replace(/\s+/g, '');
    const year = parseInt(clean.substring(0, 4));
    const month = parseInt(clean.substring(4, 6)) - 1;
    const day = parseInt(clean.substring(6, 8));
    const hour = parseInt(clean.substring(8, 10));
    const min = parseInt(clean.substring(10, 12));
    const sec = parseInt(clean.substring(12, 14) || '0');

    const date = new Date(year, month, day, hour, min, sec);

    // Handle timezone offset
    const tzMatch = clean.match(/([+-])(\d{2})(\d{2})$/);
    if (tzMatch) {
      const sign = tzMatch[1] === '+' ? 1 : -1;
      const tzHours = parseInt(tzMatch[2]);
      const tzMins = parseInt(tzMatch[3]);
      date.setMinutes(date.getMinutes() - sign * (tzHours * 60 + tzMins));
    }

    return date;
  } catch {
    return null;
  }
}

// === Name Cleaning (from original Python) ===

function cleanName(name: string): string {
  if (!name) return '';

  // Remove spaces
  let clean = name.replace(/\s+/g, '');

  // Remove content in brackets
  clean = clean.replace(/[\(\[【「][^)\]】」]*[\)\]】」]/g, '');

  // Remove noise words
  const noise = ['4K', '1080P', 'HD', '高清', '超清', '频道', 'TVB', 'CCTV', '备用', '字幕', '匹配', 'fhd', 'geo-blocked'];
  for (const word of noise) {
    clean = clean.replace(new RegExp(escapeRegex(word), 'gi'), '');
  }

  // Remove special chars, keep Chinese/letters/numbers
  clean = clean.replace(/[^\w\u4e00-\u9fa5]/g, '');

  return clean.toLowerCase();
}

function toSimplified(text: string): string {
  // Basic simplified Chinese conversion (common mappings)
  return text
    .replace(/電視/g, '电视')
    .replace(/節目/g, '节目')
    .replace(/體育/g, '体育')
    .replace(/電影/g, '电影')
    .replace(/頻道/g, '频道')
    .replace(/新聞/g, '新闻')
    .replace(/娛樂/g, '娱乐')
    .replace(/音樂/g, '音乐')
    .replace(/翡翠/g, '翡翠');
}

function toTraditional(text: string): string {
  // Basic traditional Chinese conversion
  return text
    .replace(/电视/g, '電視')
    .replace(/节目/g, '節目')
    .replace(/体育/g, '體育')
    .replace(/电影/g, '電影')
    .replace(/频道/g, '頻道')
    .replace(/新闻/g, '新聞')
    .replace(/娱乐/g, '娛樂')
    .replace(/音乐/g, '音樂');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// === Fuzzy Lookup ===

function expandCandidates(seed: string, nameMap: Map<string, string>): Set<string> {
  const candidates = new Set<string>();
  if (!seed) return candidates;

  candidates.add(seed);
  candidates.add(toSimplified(seed));
  candidates.add(toTraditional(seed));

  // Check name map for expanded candidates
  for (const c of [...candidates]) {
    if (nameMap.has(c)) candidates.add(nameMap.get(c)!);
  }

  const cleaned = cleanName(seed);
  if (cleaned) {
    candidates.add(cleaned);
    candidates.add(toTraditional(cleaned));
  }

  for (const c of [...candidates]) {
    if (nameMap.has(c)) candidates.add(nameMap.get(c)!);
  }

  return candidates;
}

function lookupInEpg(
  data: EpgData,
  tvgId: string,
  tvgName: string,
  logo?: string
): { title: string; logo: string | null } {
  const now = new Date();

  // Try tvgName first
  if (tvgName) {
    const candidates = expandCandidates(tvgName, data.nameMap);
    for (const cid of candidates) {
      const actualId = data.nameMap.get(cid) || cid;
      const progs = data.programs.get(actualId);
      if (progs) {
        for (const prog of progs) {
          if (prog.start <= now && prog.end >= now) {
            return { title: prog.title, logo: data.logos.get(actualId) || logo || null };
          }
        }
      }
    }
  }

  // Fallback to tvgId
  if (tvgId) {
    const candidates = expandCandidates(tvgId, data.nameMap);
    for (const cid of candidates) {
      const actualId = data.nameMap.get(cid) || cid;
      const progs = data.programs.get(actualId);
      if (progs) {
        for (const prog of progs) {
          if (prog.start <= now && prog.end >= now) {
            return { title: prog.title, logo: data.logos.get(actualId) || logo || null };
          }
        }
      }
    }
  }

  return { title: '无节目信息', logo: null };
}

// === Multi-Source Fetch & Merge ===

function splitEpgUrls(epgUrl: string): string[] {
  if (!epgUrl) return [];
  return epgUrl
    .split(/[|,\n]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

async function fetchEpgSource(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'APTVPlayer/1.3.9',
        'Accept': '*/*',
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) return null;

    let content = await response.text();

    // Handle gzip
    if (url.endsWith('.gz') || content.charCodeAt(0) === 0x1f) {
      try {
        const blob = new Blob([content]);
        const ds = new DecompressionStream('gzip');
        const decompressedStream = blob.stream().pipeThrough(ds);
        const reader = decompressedStream.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        const decoder = new TextDecoder();
        content = decoder.decode(new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0)));
        let offset = 0;
        for (const chunk of chunks) {
          (content as any).set?.(chunk, offset);
          offset += chunk.length;
        }
      } catch {
        // Not gzipped, use as-is
      }
    }

    return content;
  } catch (error) {
    console.error(`EPG fetch failed: ${url}`, error);
    return null;
  }
}

async function fetchAndParseEpgSources(urls: string[]): Promise<EpgData> {
  const merged: EpgData = {
    channels: new Map(),
    programs: new Map(),
    nameMap: new Map(),
    logos: new Map(),
  };

  for (const url of urls) {
    const xml = await fetchEpgSource(url);
    if (!xml) continue;

    const data = parseXmltv(xml);

    // Merge (later sources override earlier ones for same keys)
    for (const [id, ch] of data.channels) merged.channels.set(id, ch);
    for (const [id, progs] of data.programs) merged.programs.set(id, progs);
    for (const [name, id] of data.nameMap) merged.nameMap.set(name, id);
    for (const [id, logo] of data.logos) merged.logos.set(id, logo);
  }

  return merged;
}

// === Public API ===

export async function refreshEpg(
  epgUrl: string,
  kv: KVNamespace,
  force = false
): Promise<EpgData | null> {
  if (!epgUrl) return null;

  const cacheKey = `epg:data:${hashString(epgUrl)}`;

  // Check cache (1 hour TTL)
  if (!force) {
    const cached = await kv.get(cacheKey, { type: 'json' }) as any;
    if (cached && cached.timestamp && Date.now() - cached.timestamp < 3600000) {
      // Reconstruct Maps from JSON
      return {
        channels: new Map(Object.entries(cached.channels || {})),
        programs: new Map(Object.entries(cached.programs || {}).map(([k, v]) => [k, (v as any[]).map((p: any) => ({ ...p, start: new Date(p.start), end: new Date(p.end) }))])),
        nameMap: new Map(Object.entries(cached.nameMap || {})),
        logos: new Map(Object.entries(cached.logos || {})),
      };
    }
  }

  const urls = splitEpgUrls(epgUrl);
  if (urls.length === 0) return null;

  const data = await fetchAndParseEpgSources(urls);

  // Cache in KV (serialize Maps to objects)
  const serializable = {
    timestamp: Date.now(),
    channels: Object.fromEntries(data.channels),
    programs: Object.fromEntries(data.programs),
    nameMap: Object.fromEntries(data.nameMap),
    logos: Object.fromEntries(data.logos),
  };

  await kv.put(cacheKey, JSON.stringify(serializable), { expirationTtl: 7200 });

  return data;
}

export async function lookupProgram(
  epgUrl: string,
  tvgId: string,
  tvgName: string,
  kv: KVNamespace,
  logo?: string
): Promise<{ title: string; logo: string | null }> {
  const data = await refreshEpg(epgUrl, kv);
  if (!data) return { title: '无 EPG 数据', logo: null };

  return lookupInEpg(data, tvgId, tvgName, logo);
}

export async function batchLookupChannels(
  epgUrl: string,
  channels: Array<{ id: number; tvg_id: string; tvg_name: string; logo?: string }>,
  kv: KVNamespace
): Promise<Map<number, { title: string; logo: string | null }>> {
  const results = new Map<number, { title: string; logo: string | null }>();

  const data = await refreshEpg(epgUrl, kv);
  if (!data) {
    for (const ch of channels) {
      results.set(ch.id, { title: '无 EPG 数据', logo: null });
    }
    return results;
  }

  for (const ch of channels) {
    results.set(ch.id, lookupInEpg(data, ch.tvg_id, ch.tvg_name, ch.logo));
  }

  return results;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
