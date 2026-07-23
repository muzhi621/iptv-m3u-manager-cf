import type { Channel, Env } from '../types';
import { chatText, type ChatMessage } from './llm-client';

const DEFAULT_SYSTEM_PROMPT = `你是一个专业的 IPTV 节目表编排助手。你的任务是将给定的频道列表按照合理的分组进行排序。

标准分组顺序（从上到下）：
1. 央视 (CCTV)
2. 卫视
3. 港澳台
4. 地方台
5. 数字频道
6. 其他

规则：
- 每个频道只能出现在一个分组中
- 每个频道都必须被分配到某个分组
- 输出必须是有效的 JSON 格式

输出格式：
{
  "groups": [
    {"title": "央视", "channel_ids": [1, 2, 3]},
    {"title": "卫视", "channel_ids": [4, 5, 6]}
  ]
}`;

export interface OrganizeResult {
  groups: { title: string; channel_ids: number[] }[];
  same_channels: { channel_ids: number[] }[];
  error?: string;
}

export async function organizePlaylist(
  env: Env,
  channels: Channel[],
  customPrompt?: string
): Promise<OrganizeResult> {
  if (channels.length === 0) {
    return { groups: [], same_channels: [] };
  }

  // Build channel list for LLM
  const channelList = channels.map((ch) => {
    return `[ID:${ch.id}] ${ch.name} (${ch["group"] || '未分组'})`;
  }).join('\n');

  const systemPrompt = customPrompt || DEFAULT_SYSTEM_PROMPT;
  const userPrompt = `请对以下频道进行分组排序：\n\n${channelList}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const response = await chatText(env, messages);
  if (response.error) {
    return { groups: [], same_channels: [], error: response.error };
  }

  // Parse JSON response
  try {
    const parsed = parseJsonResponse(response.content);
    return {
      groups: parsed.groups || [],
      same_channels: parsed.same_channels || [],
    };
  } catch (error) {
    return {
      groups: [],
      same_channels: [],
      error: `Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function parseJsonResponse(content: string): { groups: { title: string; channel_ids: number[] }[]; same_channels: { channel_ids: number[] }[] } {
  // Try standard JSON parse
  try {
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to find JSON object in text
    const objMatch = content.match(/\{[\s\S]*\}/);
    if (objMatch) {
      return JSON.parse(objMatch[0]);
    }

    throw new Error('No valid JSON found in response');
  }
}
