import type { Env } from '../types';

export interface LlmConfig {
  base_url: string;
  api_key: string;
  model: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  error?: string;
}

export async function chatText(
  env: Env,
  messages: ChatMessage[],
  config?: LlmConfig
): Promise<ChatResponse> {
  const settings = await env.DB.prepare('SELECT llm_text_json FROM app_settings WHERE id = 1')
    .first<{ llm_text_json: string }>();

  const llmConfig = config || JSON.parse(settings?.llm_text_json || '{}');
  if (!llmConfig.base_url || !llmConfig.api_key) {
    return { content: '', error: 'LLM text config not set' };
  }

  try {
    const baseUrl = llmConfig.base_url.replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.api_key}`,
      },
      body: JSON.stringify({
        model: llmConfig.model || 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `LLM API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function chatVisionJson(
  env: Env,
  messages: ChatMessage[],
  config?: LlmConfig
): Promise<ChatResponse> {
  const settings = await env.DB.prepare('SELECT llm_vision_json FROM app_settings WHERE id = 1')
    .first<{ llm_vision_json: string }>();

  const llmConfig = config || JSON.parse(settings?.llm_vision_json || '{}');
  if (!llmConfig.base_url || !llmConfig.api_key) {
    return { content: '', error: 'LLM vision config not set' };
  }

  // Same as chatText but with vision model
  try {
    const baseUrl = llmConfig.base_url.replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.api_key}`,
      },
      body: JSON.stringify({
        model: llmConfig.model || 'gpt-4-vision-preview',
        messages,
        temperature: 0.3,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { content: '', error: `Vision LLM API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (error) {
    return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
