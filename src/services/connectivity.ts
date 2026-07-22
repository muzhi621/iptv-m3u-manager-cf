export interface ConnectivityResult {
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
  status_code?: number;
}

export async function checkUrl(
  url: string,
  timeoutMs = 5000
): Promise<ConnectivityResult> {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    const latency = Date.now() - start;

    return {
      status: response.ok ? 'ok' : 'error',
      latency,
      status_code: response.status,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
