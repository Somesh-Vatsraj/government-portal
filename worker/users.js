import { json, error } from './database.js';
import { requireAuth, hashPassword } from './auth.js';

export async function handleUsers(request, env, path) {
  const user = await requireAuth(request, env, 'admin');
  if (!user) return error('Unauthorized', 401);
  const method = request.method;

  if (path === '/admin/users' && method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    ).all();
    return json({ users: rows.results });
  }

  if (path === '/admin/users' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON'); }
    const { name, email, password, role } = body || {};
    if (!name || !email || !password) return error('name, email, password required');
    const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (exists) return error('Email already exists', 409);
    const hash = await hashPassword(password);
    const r = await env.DB.prepare(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
    ).bind(name, email, hash, role === 'admin' ? 'admin' : 'user').run();
    const created = await env.DB.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').bind(r.meta.last_row_id).first();
    return json({ user: created });
  }

  const idMatch = path.match(/^\/admin\/users\/(\d+)$/);
  if (idMatch && method === 'DELETE') {
    if (parseInt(idMatch[1]) === user.id) return error('Cannot delete your own account');
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(idMatch[1]).run();
    return json({ ok: true });
  }

  return error('Not found', 404);
}
