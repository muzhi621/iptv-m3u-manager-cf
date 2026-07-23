import type { Env } from '../types';

const DEFAULT_PASSWORD = 'admin';
const DEFAULT_SECRET = 'iptv-m3u-manager-default-secret';

export function verifyPassword(password: string, env: Env): boolean {
  const expected = env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  return password === expected;
}

export function createToken(env: Env): string {
  const secret = env.COOKIE_SECRET || DEFAULT_SECRET;
  const data = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
  return btoa(data + ':' + simpleHash(data + secret));
}

export function verifyToken(token: string, env: Env): boolean {
  const secret = env.COOKIE_SECRET || DEFAULT_SECRET;
  try {
    const decoded = atob(token);
    const [data, hash] = decoded.split(':');
    if (!data || !hash) return false;
    // Check if token is not too old (7 days)
    const timestamp = parseInt(data.split(':')[0]);
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return false;
    return simpleHash(data + secret) === hash;
  } catch {
    return false;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Fallback to cookie
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      if (name === 'iptv_token') return value;
    }
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
