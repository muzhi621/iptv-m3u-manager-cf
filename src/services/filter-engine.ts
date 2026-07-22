import type { M3UChannel, FilterRule } from '../types';

export function applyFilters(
  channels: M3UChannel[],
  rules: FilterRule[]
): M3UChannel[] {
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

function getTargetValue(ch: M3UChannel, target: string): string {
  switch (target) {
    case 'name': return ch.name;
    case 'group': return ch.group_title;
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
