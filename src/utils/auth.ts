import type { Env } from '../types';

const SESSION_COOKIE = 'iptv_session';
const SESSION_TTL = 86400 * 7; // 7 days

// Default values when env vars are not set
const DEFAULT_PASSWORD = 'admin';
const DEFAULT_SECRET = 'iptv-m3u-manager-default-secret';

export function verifyPassword(password: string, env: Env): boolean {
  const expected = env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  return password === expected;
}

export function createSessionToken(env: Env): string {
  const secret = env.COOKIE_SECRET || DEFAULT_SECRET;
  const data = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
  return btoa(data + ':' + simpleHash(data + secret));
}

export function verifySession(token: string, env: Env): boolean {
  const secret = env.COOKIE_SECRET || DEFAULT_SECRET;
  try {
    const decoded = atob(token);
    const [data, hash] = decoded.split(':');
    if (!data || !hash) return false;
    return simpleHash(data + secret) === hash;
  } catch {
    return false;
  }
}

export function getSessionCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === SESSION_COOKIE) return value;
  }
  return null;
}

export function setSessionCookie(token: string): string {
  const expires = new Date(Date.now() + SESSION_TTL * 1000).toUTCString();
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isAuthenticated(request: Request, env: Env): boolean {
  const token = getSessionCookie(request);
  if (!token) return false;
  return verifySession(token, env);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
