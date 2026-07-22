import type { Env, Channel } from '../types';
import { chatVisionJson, type ChatMessage } from './llm-client';

const VISION_SYSTEM_PROMPT = `你是一个专业的 IPTV 频道视觉检测助手。分析提供的频道截图，判断频道是否正常工作。

判定标准：
- ok: 正常播放内容
- promo_loop: 循环播放广告/宣传片
- invalid: 无效内容（黑屏、花屏、测试卡等）
- frozen: 画面静止/卡顿
- no_image: 无法获取画面
- error: 检测失败

输出格式（JSON）：
{
  "status": "ok",
  "detail": "正常播放新闻节目"
}

请只返回 JSON，不要添加其他文字。`;

export interface VisionCheckResult {
  status: 'ok' | 'promo_loop' | 'invalid' | 'frozen' | 'no_image' | 'error';
  detail: string;
  error?: string;
}

export async function checkChannelVision(
  env: Env,
  channelId: number,
  screenshotBase64?: string
): Promise<VisionCheckResult> {
  if (!screenshotBase64) {
    return { status: 'no_image', detail: 'No screenshot available' };
  }

  const settings = await env.DB.prepare('SELECT llm_vision_json FROM app_settings WHERE id = 1')
    .first<{ llm_vision_json: string }>();

  const config = JSON.parse(settings?.llm_vision_json || '{}');
  if (!config.base_url || !config.api_key) {
    return { status: 'error', detail: 'Vision LLM not configured' };
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: VISION_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: '请分析这个频道截图是否正常：' },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` } },
      ] as any,
    },
  ];

  const response = await chatVisionJson(env, messages);
  if (response.error) {
    return { status: 'error', detail: response.error };
  }

  try {
    const parsed = parseJsonResponse(response.content);
    return {
      status: parsed.status || 'error',
      detail: parsed.detail || '',
    };
  } catch {
    return { status: 'error', detail: 'Failed to parse vision response' };
  }
}

export async function batchCheckVision(
  env: Env,
  channelIds: number[]
): Promise<Map<number, VisionCheckResult>> {
  const results = new Map<number, VisionCheckResult>();

  for (const id of channelIds) {
    const channel = await env.DB.prepare('SELECT id, check_image FROM channels WHERE id = ?')
      .bind(id).first<{ id: number; check_image: string }>();

    if (!channel) {
      results.set(id, { status: 'error', detail: 'Channel not found' });
      continue;
    }

    const result = await checkChannelVision(env, id, channel.check_image || undefined);
    results.set(id, result);

    // Update channel in database
    await env.DB.prepare(
      'UPDATE channels SET ai_visual_status = ?, ai_visual_detail = ?, ai_visual_date = datetime(\'now\') WHERE id = ?'
    ).bind(result.status, result.detail, id).run();
  }

  return results;
}

function parseJsonResponse(content: string): { status: string; detail: string } {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1].trim());

    const objMatch = content.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);

    throw new Error('No valid JSON');
  }
}
