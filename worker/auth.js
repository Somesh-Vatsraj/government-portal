import { json, error } from './database.js';

/* ---------- base64url helpers ---------- */
function b64uEncode(input) {
  let bin;
  if (typeof input === 'string') {
    const bytes = new TextEncoder().encode(input);
    bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
  } else {
    bin = '';
    for (const b of input) bin += String.fromCharCode(b);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ---------- password hashing ---------- */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  const saltHex = [...salt].map((b) => b.toString(16).padStart(2, '0')).join('');
  const hashHex = [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2$${saltHex}$${hashHex}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'pbkdf2') return false;
  const [, saltHex, hashHex] = parts;
  try {
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      key,
      256
    );
    const computedHex = [...new Uint8Array(bits)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return computedHex === hashHex;
  } catch {
    return false;
  }
}

/* ---------- tokens ---------- */
function getSecret(env) {
  const s = env && env.AUTH_SECRET;
  if (!s || String(s).trim().length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. ' +
        'Create a .dev.vars file in project root with AUTH_SECRET=<long-random-string> ' +
        'and restart wrangler dev.'
    );
  }
  return s;
}

export async function createToken(payload, secret) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + 60 * 60 * 24 * 7 };
  const headerB64 = b64uEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const bodyB64 = b64uEncode(JSON.stringify(body));
  const data = `${headerB64}.${bodyB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${b64uEncode(new Uint8Array(sig))}`;
}

export async function verifyToken(token, secret) {
  if (!token || !secret) return null;
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sigB64] = parts;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sig = b64uDecodeBytes(sigB64);
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      sig,
      new TextEncoder().encode(`${headerB64}.${bodyB64}`)
    );
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
  if (!token) return null;
  let secret;
  try { secret = getSecret(env); } catch { return null; }
  const payload = await verifyToken(token, secret);
  if (!payload) return null;
  if (role && payload.role !== role) return null;
  return payload;
}

/* ---------- routes ---------- */
export async function handleAuth(request, env, path) {
  const method = request.method;

  if (path === '/auth/register' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON body'); }
    const { name, email, password } = body || {};
    if (!name || !email || !password) return error('name, email and password are required');
    if (String(password).length < 6) return error('Password must be at least 6 characters');
    if (!/^\S+@\S+\.\S+$/.test(email)) return error('Invalid email format');

    // Ensure DB binding exists
    if (!env.DB) return error('Database not configured (DB binding missing)', 500);

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first();
    if (existing) return error('Email already registered', 409);

    const countRow = await env.DB.prepare('SELECT COUNT(*) AS c FROM users').first();
    const role = (countRow?.c || 0) === 0 ? 'admin' : 'user';

    const hash = await hashPassword(password);
    const result = await env.DB.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    )
      .bind(name, email, hash, role)
      .run();

    const secret = getSecret(env);
    const token = await createToken(
      { id: result.meta.last_row_id, email, role },
      secret
    );
    return json({
      token,
      user: { id: result.meta.last_row_id, name, email, role }
    });
  }

  if (path === '/auth/login' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON body'); }
    const { email, password } = body || {};
    if (!email || !password) return error('Email and password required');
    if (!env.DB) return error('Database not configured (DB binding missing)', 500);

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();
    if (!user) {
      // Don't reveal which part failed
      return error('Invalid email or password', 401);
    }

    let ok = false;
    try {
      ok = await verifyPassword(password, user.password_hash);
    } catch (e) {
      console.error('verifyPassword error:', e);
      return error('Login failed. Please try again.', 500);
    }
    if (!ok) return error('Invalid email or password', 401);

    let secret;
    try {
      secret = getSecret(env);
    } catch (e) {
      console.error('AUTH_SECRET problem:', e.message);
      return error(
        'Server auth is not configured. Set AUTH_SECRET in .dev.vars (local) or via wrangler secret (production).',
        500
      );
    }

    const token = await createToken(
      { id: user.id, email: user.email, role: user.role },
      secret
    );
    return json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  }

  if (path === '/auth/logout' && method === 'POST') {
    return json({ ok: true });
  }

  if (path === '/auth/me' && method === 'GET') {
    const payload = await requireAuth(request, env);
    if (!payload) return error('Unauthorized', 401);
    const user = await env.DB.prepare(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?'
    )
      .bind(payload.id)
      .first();
    if (!user) return error('Unauthorized', 401);
    return json({ user });
  }

  return error('Not found', 404);
}
