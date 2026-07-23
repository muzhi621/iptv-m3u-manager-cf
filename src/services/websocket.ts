// WebSocket Real-time Push for Cloudflare Workers
// Uses Durable Objects for WebSocket management (simplified: polling fallback)

import type { Env } from '../types';

export interface WsMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

// In-memory connection pool (per worker instance)
const connections = new Map<string, Set<WebSocket>>();

export function handleWebSocketUpgrade(
  request: Request,
  env: Env
): Response {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id') || crypto.randomUUID();

  // Create WebSocket pair
  const pair = new WebSocketPair();
  const [server, client] = [pair[0], pair[1]];

  // Accept connection
  server.accept();

  // Register connection
  if (!connections.has(clientId)) {
    connections.set(clientId, new Set());
  }
  connections.get(clientId)!.add(server);

  // Handle messages
  server.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data as string);
      handleClientMessage(clientId, server, msg, env);
    } catch (e) {
      server.send(JSON.stringify({ type: 'error', data: 'Invalid message format' }));
    }
  });

  server.addEventListener('close', () => {
    connections.get(clientId)?.delete(server);
    if (connections.get(clientId)?.size === 0) {
      connections.delete(clientId);
    }
  });

  server.addEventListener('error', () => {
    connections.get(clientId)?.delete(server);
  });

  // Send welcome message
  server.send(JSON.stringify({
    type: 'connected',
    data: { client_id: clientId },
    timestamp: Date.now(),
  }));

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

function handleClientMessage(
  clientId: string,
  ws: WebSocket,
  msg: { type: string; data?: unknown },
  env: Env
): void {
  switch (msg.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    case 'subscribe':
      // Client subscribes to specific channels
      ws.send(JSON.stringify({ type: 'subscribed', data: msg.data }));
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', data: `Unknown message type: ${msg.type}` }));
  }
}

// Broadcast to all connected clients
export function broadcast(message: WsMessage): void {
  const payload = JSON.stringify(message);
  for (const [, clients] of connections) {
    for (const ws of clients) {
      try {
        ws.send(payload);
      } catch {
        // Connection closed
      }
    }
  }
}

// Broadcast task updates
export function broadcastTaskUpdate(taskId: string, status: string, progress: number, message: string): void {
  broadcast({
    type: 'task_update',
    data: { id: taskId, status, progress, message },
    timestamp: Date.now(),
  });
}

// Broadcast channel patches
export function broadcastChannelPatch(channelId: number, data: Record<string, unknown>): void {
  broadcast({
    type: 'channel_patch',
    data: { id: channelId, ...data },
    timestamp: Date.now(),
  });
}

// Broadcast output updates
export function broadcastOutputUpdate(outputId: number, data: Record<string, unknown>): void {
  broadcast({
    type: 'output_update',
    data: { id: outputId, ...data },
    timestamp: Date.now(),
  });
}

// Get connection count
export function getConnectionCount(): number {
  let count = 0;
  for (const clients of connections.values()) {
    count += clients.size;
  }
  return count;
}
