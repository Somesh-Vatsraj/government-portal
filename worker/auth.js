import { json, error } from './database.js';

function b64uEncode(input) {
  const str = typeof input === 'string'
    ? btoa(unescape(encodeURIComponent(input)))
    : (() => { let s = ''; for (const b of input) s += String.fromCharCode(b); return btoa(s); })();
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecodeBytes(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64uDecodeString(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 3) return false;
  const [, saltHex, hashHex] = parts;
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const computedHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHex === hashHex;
}

export async function createToken(payload, secret) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + 60 * 60 * 24 * 7 };
  const headerB64 = b64uEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const bodyB64 = b64uEncode(JSON.stringify(body));
  const data = `${headerB64}.${bodyB64}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64uEncode(new Uint8Array(sig))}`;
}

export async function verifyToken(token, secret) {
  if (!token || !secret) return null;
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sigB64] = parts;
  try {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sig = b64uDecodeBytes(sigB64);
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(`${headerB64}.${bodyB64}`));
    if (!valid) return null;
    const payload = JSON.parse(b64uDecodeString(bodyB64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(request, env, role) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = await verifyToken(token, env.AUTH_SECRET);
  if (!payload) return null;
  if (role && payload.role !== role) return null;
  return payload;
}

export async function handleAuth(request, env, path) {
  const method = request.method;

  if (path === '/auth/register' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON'); }
    const { name, email, password } = body || {};
    if (!name || !email || !password) return error('name, email and password are required');
    if (String(password).length < 6) return error('Password must be at least 6 characters');
    if (!/^\S+@\S+\.\S+$/.test(email)) return error('Invalid email');

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return error('Email already registered', 409);

    const countRow = await env.DB.prepare('SELECT COUNT(*) AS c FROM users').first();
    const role = (countRow?.c || 0) === 0 ? 'admin' : 'user';

    const hash = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).bind(name, email, hash, role).run();

    const token = await createToken({ id: result.meta.last_row_id, email, role }, env.AUTH_SECRET);
    return json({ token, user: { id: result.meta.last_row_id, name, email, role } });
  }

  if (path === '/auth/login' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON'); }
    const { email, password } = body || {};
    if (!email || !password) return error('Email and password required');
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) return error('Invalid credentials', 401);
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return error('Invalid credentials', 401);
    const token = await createToken({ id: user.id, email: user.email, role: user.role }, env.AUTH_SECRET);
    return json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  }

  if (path === '/auth/logout' && method === 'POST') {
    return json({ ok: true });
  }

  if (path === '/auth/me' && method === 'GET') {
    const payload = await requireAuth(request, env);
    if (!payload) return error('Unauthorized', 401);
    const user = await env.DB.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').bind(payload.id).first();
    if (!user) return error('Unauthorized', 401);
    return json({ user });
  }

  return error('Not found', 404);
}
