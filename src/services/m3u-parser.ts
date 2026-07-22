import type { M3UChannel, M3UPlaylist } from '../types';

export function parseM3U(content: string): M3UPlaylist {
  const lines = content.split(/\r?\n/);
  const channels: M3UChannel[] = [];

  // Check if it's TXT format (grouped by genre)
  if (content.includes('#genre#')) {
    return parseTxt(content);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXTINF:')) continue;

    const info = parseExtInf(line);
    const url = findNextUrl(lines, i + 1);

    if (url) {
      channels.push({
        name: info.name || url.split('/').pop() || 'Unknown',
        tvg_id: info.tvg_id || '',
        tvg_name: info.tvg_name || '',
        tvg_logo: info.tvg_logo || '',
        tvg_chno: info.tvg_chno || '',
        group_title: info.group_title || 'Default',
        url,
      });
    }
  }

  return { channels, raw: content };
}

function parseTxt(content: string): M3UPlaylist {
  const lines = content.split(/\r?\n/);
  const channels: M3UChannel[] = [];
  let currentGroup = 'Default';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Group header: "组名,#genre#"
    if (trimmed.endsWith('#genre#')) {
      currentGroup = trimmed.replace(/,#genre#$/, '').trim();
      continue;
    }

    // Channel line: "名称,URL" or "名称#URL"
    const commaMatch = trimmed.match(/^(.+?)[,#](https?:\/\/.+)$/);
    if (commaMatch) {
      channels.push({
        name: commaMatch[1].trim(),
        tvg_id: '',
        tvg_name: commaMatch[1].trim(),
        tvg_logo: '',
        tvg_chno: '',
        group_title: currentGroup,
        url: commaMatch[2].trim(),
      });
      continue;
    }

    // Pure URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      channels.push({
        name: trimmed.split('/').pop() || 'Unknown',
        tvg_id: '',
        tvg_name: '',
        tvg_logo: '',
        tvg_chno: '',
        group_title: currentGroup,
        url: trimmed,
      });
    }
  }

  return { channels, raw: content };
}

function parseExtInf(line: string): Partial<M3UChannel> {
  const result: Partial<M3UChannel> = {};

  const attrRegex = /([\w-]+)="([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(line)) !== null) {
    const [, key, value] = match;
    switch (key) {
      case 'tvg-id': result.tvg_id = value; break;
      case 'tvg-name': result.tvg_name = value; break;
      case 'tvg-logo': result.tvg_logo = value; break;
      case 'tvg-chno': result.tvg_chno = value; break;
      case 'group-title': result.group_title = value; break;
    }
  }

  const commaIdx = line.lastIndexOf(',');
  if (commaIdx !== -1) {
    result.name = line.substring(commaIdx + 1).trim();
  }

  return result;
}

function findNextUrl(lines: string[], startIdx: number): string | null {
  for (let i = startIdx; i < Math.min(startIdx + 3, lines.length); i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#') && (line.startsWith('http://') || line.startsWith('https://'))) {
      return line;
    }
  }
  return null;
}

export function generateM3U(channels: M3UChannel[], title = 'IPTV Playlist'): string {
  const lines = ['#EXTM3U x-tvg-url=""'];

  for (const ch of channels) {
    const attrs: string[] = [];
    if (ch.tvg_id) attrs.push(`tvg-id="${ch.tvg_id}"`);
    if (ch.tvg_name) attrs.push(`tvg-name="${ch.tvg_name}"`);
    if (ch.tvg_logo) attrs.push(`tvg-logo="${ch.tvg_logo}"`);
    if (ch.tvg_chno) attrs.push(`tvg-chno="${ch.tvg_chno}"`);
    if (ch.group_title) attrs.push(`group-title="${ch.group_title}"`);

    const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
    lines.push(`#EXTINF:-1${attrStr},${ch.name}`);
    lines.push(ch.url);
  }

  return lines.join('\n');
}
