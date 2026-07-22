import type { M3UChannel } from '../types';

export interface GroupRule {
  name: string;
  display_name: string;
  patterns: string[];
}

const DEFAULT_GROUPS: GroupRule[] = [
  { name: 'cctv', display_name: '央视', patterns: ['CCTV', '中央', '央视'] },
  { name: 'satellite', display_name: '卫视', patterns: ['卫视', 'Satellite'] },
  { name: 'sports', display_name: '体育', patterns: ['体育', 'Sport', 'ESPN', 'NBA'] },
  { name: 'news', display_name: '新闻', patterns: ['新闻', 'News', 'CNN', 'BBC'] },
  { name: 'movie', display_name: '电影', patterns: ['电影', 'Movie', 'Cinema'] },
  { name: 'entertainment', display_name: '综艺', patterns: ['综艺', 'Entertainment'] },
  { name: 'kids', display_name: '少儿', patterns: ['少儿', '卡通', 'Kids', 'Cartoon'] },
  { name: 'music', display_name: '音乐', patterns: ['音乐', 'Music', 'MTV'] },
  { name: 'local', display_name: '地方', patterns: ['地方', 'Local', '都市'] },
];

export function autoGroup(channels: M3UChannel[], customRules?: GroupRule[]): M3UChannel[] {
  const rules = customRules || DEFAULT_GROUPS;

  return channels.map((ch) => {
    if (ch.group_title && ch.group_title !== 'Default') return ch;

    const matched = matchGroup(ch, rules);
    return { ...ch, group_title: matched || '其他' };
  });
}

function matchGroup(ch: M3UChannel, rules: GroupRule[]): string | null {
  const text = `${ch.name} ${ch.tvg_name}`.toLowerCase();

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (text.includes(pattern.toLowerCase())) {
        return rule.display_name;
      }
    }
  }
  return null;
}
