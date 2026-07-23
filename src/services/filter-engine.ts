import type { M3UChannel, Channel, FilterRule } from '../types';

type FilterableChannel = M3UChannel | Channel;

export function applyFilters(
  channels: FilterableChannel[],
  rules: FilterRule[]
): FilterableChannel[] {
  const activeRules = rules.filter((r) => r.enabled);
  if (activeRules.length === 0) return channels;

  return channels.filter((ch) => {
    let included = true;

    for (const rule of activeRules) {
      const targetValue = getTargetValue(ch, rule.target);
      const matches = rule.is_regex
        ? testRegex(rule.pattern, targetValue)
        : targetValue.toLowerCase().includes(rule.pattern.toLowerCase());

      if (rule.type === 'include' && !matches) {
        included = false;
        break;
      }
      if (rule.type === 'exclude' && matches) {
        included = false;
        break;
      }
    }

    return included;
  });
}

function getTargetValue(ch: FilterableChannel, target: string): string {
  switch (target) {
    case 'name': return ch.name;
    case 'group': return 'group_title' in ch ? ch.group_title : ch["group"];
    case 'url': return ch.url;
    default: return ch.name;
  }
}

function testRegex(pattern: string, value: string): boolean {
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(value);
  } catch {
    return false;
  }
}
