import type { Env } from '../types';

const DEFAULT_PASSWORD = 'admin';
const DEFAULT_SECRET = 'iptv-m3u-manager-default-secret';

export function verifyPassword(password: string, env: Env): boolean {
  const expected = env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  return password === expected;
}

export function createToken(env: Env): string {
  const secret = env.COOKIE_SECRET || DEFAULT_SECRET;
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2);
  const payload = `${timestamp}.${random}`;
  const hash = simpleHash(payload + secret);
  // Use URL-safe base64
  return btoa(`${payload}.${hash}`)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function verifyToken(token: string, env: Env): boolean {
  const secret = env.COOKIE_SECRET || DEFAULT_SECRET;
  try {
    // Restore standard base64
    let std = token.replace(/-/g, '+').replace(/_/g, '/');
    while (std.length % 4) std += '=';
    const decoded = atob(std);
    const lastDot = decoded.lastIndexOf('.');
    if (lastDot === -1) return false;
    const payload = decoded.substring(0, lastDot);
    const hash = decoded.substring(lastDot + 1);

    // Check if token is not too old (7 days)
    const timestamp = parseInt(payload.split('.')[0]);
    if (isNaN(timestamp) || Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return false;

    return simpleHash(payload + secret) === hash;
  } catch {
    return false;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

export function isAuthenticated(request: Request, env: Env): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  return verifyToken(token, env);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
