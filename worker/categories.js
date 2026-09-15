import { json, error, slugify } from './database.js';
import { requireAuth } from './auth.js';

export async function handleCategories(request, env, path, isAdmin) {
  const method = request.method;

  if (path === '/categories' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT * FROM categories ORDER BY id').all();
    return json({ categories: rows.results });
  }

  if (!isAdmin) return error('Not found', 404);
  const user = await requireAuth(request, env, 'admin');
  if (!user) return error('Unauthorized', 401);

  if (path === '/admin/categories' && method === 'GET') {
    const rows = await env.DB.prepare('SELECT * FROM categories ORDER BY id').all();
    return json({ categories: rows.results });
  }

  if (path === '/admin/categories' && method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON'); }
    if (!body?.name) return error('Name required');
    const slug = slugify(body.slug || body.name);
    const result = await env.DB.prepare(
      'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)'
    ).bind(body.name, slug, body.description || null).run();
    const category = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(result.meta.last_row_id).first();
    return json({ category });
  }

  const idMatch = path.match(/^\/admin\/categories\/(\d+)$/);
  if (idMatch && method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON'); }
    if (!body?.name) return error('Name required');
    const slug = slugify(body.slug || body.name);
    await env.DB.prepare(
      'UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?'
    ).bind(body.name, slug, body.description || null, idMatch[1]).run();
    const category = await env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(idMatch[1]).first();
    return json({ category });
  }

  if (idMatch && method === 'DELETE') {
    const used = await env.DB.prepare('SELECT COUNT(*) AS c FROM posts WHERE category_id = ?').bind(idMatch[1]).first();
    if (used.c > 0) return error(`Category is used by ${used.c} post(s)`, 409);
    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(idMatch[1]).run();
    return json({ ok: true });
  }

  return error('Not found', 404);
}
