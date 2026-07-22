import type { Env } from '../types';
import { organizePlaylist } from '../services/playlist-organizer';
import { batchCheckVision } from '../services/visual-ai-checker';
import { aggregateChannels, filterChannels, getOutputSource, updateOutputSource } from './outputs';
import { createTask, updateTask } from './tasks';

export async function aiGroup(
  env: Env,
  outputId: number,
  customPrompt?: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const output = await getOutputSource(env, outputId);
  if (!output) return { success: false, error: 'Output source not found' };

  const taskId = `ai-group-${outputId}-${Date.now()}`;
  await createTask(env, taskId, `AI 分组: ${output.name}`);

  try {
    await updateTask(env, taskId, { status: 'running', progress: 10, message: '正在准备频道数据...' });

    const allChannels = await aggregateChannels(env, output);
    const filtered = await filterChannels(allChannels, output);

    await updateTask(env, taskId, { progress: 30, message: `正在分析 ${filtered.length} 个频道...` });

    const result = await organizePlaylist(filtered, customPrompt);
    if (result.error) {
      await updateTask(env, taskId, { status: 'failure', message: result.error });
      return { success: false, error: result.error };
    }

    await updateTask(env, taskId, { progress: 80, message: '正在保存分组结果...' });

    // Save layout to output source
    await updateOutputSource(env, outputId, {
      channel_layout: JSON.stringify({ groups: result.groups }),
      layout_meta: JSON.stringify({ same_channels: result.same_channels }),
      layout_mode: 'explicit',
    });

    await updateTask(env, taskId, {
      status: 'success',
      progress: 100,
      message: `AI 分组完成: ${result.groups.length} 个分组`,
      result: JSON.stringify(result),
    });

    return { success: true, data: result };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTask(env, taskId, { status: 'failure', message: msg });
    return { success: false, error: msg };
  }
}

export async function aiSort(
  env: Env,
  outputId: number,
  customPrompt?: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  // AI sort is essentially the same as AI group with custom sorting prompt
  const sortPrompt = customPrompt || '请按照频道热度和重要性排序，热门频道排在前面。';
  return aiGroup(env, outputId, sortPrompt);
}

export async function aiVisionCheck(
  env: Env,
  outputId: number,
  channelIds?: number[]
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const output = await getOutputSource(env, outputId);
  if (!output) return { success: false, error: 'Output source not found' };

  const taskId = `ai-vision-${outputId}-${Date.now()}`;
  await createTask(env, taskId, `AI 视觉检测: ${output.name}`);

  try {
    await updateTask(env, taskId, { status: 'running', progress: 10, message: '正在准备检测...' });

    let targetIds = channelIds;
    if (!targetIds || targetIds.length === 0) {
      const allChannels = await aggregateChannels(env, output);
      const filtered = await filterChannels(allChannels, output);
      targetIds = filtered.map((ch) => ch.id);
    }

    await updateTask(env, taskId, { progress: 30, message: `正在检测 ${targetIds.length} 个频道...` });

    const results = await batchCheckVision(env, targetIds);

    // Auto-disable invalid channels if configured
    if (output.auto_disable_on_check) {
      for (const [id, result] of results) {
        if (result.status === 'invalid' || result.status === 'promo_loop') {
          await env.DB.prepare('UPDATE channels SET is_enabled = 0 WHERE id = ?').bind(id).run();
        } else if (result.status === 'ok') {
          await env.DB.prepare('UPDATE channels SET is_enabled = 1 WHERE id = ?').bind(id).run();
        }
      }
    }

    const summary = {
      total: targetIds.length,
      ok: Array.from(results.values()).filter((r) => r.status === 'ok').length,
      invalid: Array.from(results.values()).filter((r) => r.status === 'invalid').length,
      error: Array.from(results.values()).filter((r) => r.status === 'error').length,
    };

    await updateTask(env, taskId, {
      status: 'success',
      progress: 100,
      message: `检测完成: ${summary.ok} 正常, ${summary.invalid} 异常, ${summary.error} 错误`,
      result: JSON.stringify(summary),
    });

    return { success: true, data: summary };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTask(env, taskId, { status: 'failure', message: msg });
    return { success: false, error: msg };
  }
}
