import { Hono } from 'hono';
import type { Env } from '../types';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
} from '../utils/auth';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/api/auth/login', async (c) => {
  const body = await c.req.json<{ password: string }>();

  if (!verifyPassword(body.password, c.env)) {
    return c.json({ success: false, error: 'Invalid password' }, 401);
  }

  const token = createSessionToken(c.env);
  const cookie = setSessionCookie(token);

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
});

auth.post('/api/auth/logout', async (c) => {
  const cookie = clearSessionCookie();
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
});

auth.get('/api/auth/status', async (c) => {
  const authenticated = isAuthenticated(c.req.raw, c.env);
  return c.json({ success: true, authenticated });
});

export default auth;
