import { json, error, slugify, sha256Hex } from './database.js';
import { requireAuth } from './auth.js';

const POST_FIELDS = [
  'title','slug','category_id','short_description','content','featured_image_id','featured_image_url',
  'organization','post_name','total_vacancy','application_start_date','application_last_date',
  'exam_date','result_date','salary','age_limit','application_fee','eligibility','selection_process',
  'how_to_apply','important_dates','important_links','official_website','apply_link','notification_link',
  'download_link','status','seo_title','seo_description','seo_keywords','canonical_url'
];

export async function handlePosts(request, env, path, isAdmin) {
  const method = request.method;

  if (isAdmin) {
    const user = await requireAuth(request, env, 'admin');
    if (!user) return error('Unauthorized', 401);
  }

  // ---- PUBLIC LIST ----
  if (path === '/posts' && method === 'GET') {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '12')));
    const offset = (page - 1) * limit;
    const category = url.searchParams.get('category');

    const where = ["p.status = 'published'"];
    const params = [];
    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    const whereSql = where.join(' AND ');

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(
        `SELECT p.id, p.title, p.slug, p.short_description, p.featured_image_url,
                p.organization, p.created_at, p.updated_at, p.views,
                c.name AS category_name, c.slug AS category_slug
         FROM posts p JOIN categories c ON c.id = p.category_id
         WHERE ${whereSql}
         ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
      ).bind(...params, limit, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) AS total FROM posts p JOIN categories c ON c.id = p.category_id WHERE ${whereSql}`
      ).bind(...params).first()
    ]);

    return json({
      posts: rows.results,
      pagination: {
        page, limit,
        total: countRow?.total || 0,
        pages: Math.ceil((countRow?.total || 0) / limit)
      }
    });
  }

  // ---- ADMIN LIST ----
  if (path === '/admin/posts' && method === 'GET') {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status');
    const q = url.searchParams.get('q');

    const where = [];
    const params = [];
    if (status) { where.push('p.status = ?'); params.push(status); }
    if (q) { where.push('p.title LIKE ?'); params.push(`%${q}%`); }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(
        `SELECT p.id, p.title, p.slug, p.status, p.views, p.created_at, p.updated_at,
                c.name AS category_name
         FROM posts p JOIN categories c ON c.id = p.category_id
         ${whereSql}
         ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
      ).bind(...params, limit, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) AS total FROM posts p ${whereSql}`
      ).bind(...params).first()
    ]);

    return json({
      posts: rows.results,
      pagination: { page, limit, total: countRow?.total || 0, pages: Math.ceil((countRow?.total || 0) / limit) }
    });
  }

  // ---- GET BY SLUG (public) ----
  const slugMatch = path.match(/^\/posts\/(.+)$/);
  if (slugMatch && method === 'GET') {
    const slug = decodeURIComponent(slugMatch[1]);
    const post = await env.DB.prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.status = 'published'`
    ).bind(slug).first();
    if (!post) return error('Post not found', 404);

    // record view (non-blocking)
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ua = request.headers.get('User-Agent') || '';
    const ipHash = await sha256Hex(ip + (env.AUTH_SECRET || 'salt'));
    try {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO post_views (post_id, ip_hash, user_agent) VALUES (?, ?, ?)').bind(post.id, ipHash, ua),
        env.DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(post.id)
      ]);
    } catch (e) { /* ignore */ }

    const related = await env.DB.prepare(
      `SELECT id, title, slug, featured_image_url, short_description, created_at
       FROM posts WHERE category_id = ? AND id != ? AND status = 'published'
       ORDER BY created_at DESC LIMIT 6`
    ).bind(post.category_id, post.id).all();

    return json({ post: { ...post, views: post.views + 1 }, related: related.results });
  }

  // ---- CREATE ----
  if (path === '/admin/posts' && method === 'POST') {
    let data;
    try { data = await request.json(); } catch { return error('Invalid JSON'); }
    if (!data.title || !data.category_id) return error('Title and category are required');

    data.slug = data.slug ? slugify(data.slug) : slugify(data.title);
    // ensure unique slug
    const clash = await env.DB.prepare('SELECT id FROM posts WHERE slug = ?').bind(data.slug).first();
    if (clash) data.slug = `${data.slug}-${Date.now().toString(36).slice(-4)}`;

    const values = POST_FIELDS.map(f => data[f] ?? null);
    const placeholders = POST_FIELDS.map(() => '?').join(', ');
    const result = await env.DB.prepare(
      `INSERT INTO posts (${POST_FIELDS.join(', ')}) VALUES (${placeholders})`
    ).bind(...values).run();

    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(result.meta.last_row_id).first();
    return json({ post });
  }

  // ---- GET BY ID (admin) ----
  const idMatch = path.match(/^\/admin\/posts\/(\d+)$/);
  if (idMatch && method === 'GET') {
    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(idMatch[1]).first();
    if (!post) return error('Not found', 404);
    return json({ post });
  }

  if (idMatch && method === 'PUT') {
    let data;
    try { data = await request.json(); } catch { return error('Invalid JSON'); }
    if (data.slug) data.slug = slugify(data.slug);
    const sets = POST_FIELDS.map(f => `${f} = ?`).join(', ');
    const values = POST_FIELDS.map(f => data[f] ?? null);
    await env.DB.prepare(
      `UPDATE posts SET ${sets}, updated_at = datetime('now') WHERE id = ?`
    ).bind(...values, idMatch[1]).run();
    const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(idMatch[1]).first();
    return json({ post });
  }

  if (idMatch && method === 'DELETE') {
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(idMatch[1]).run();
    return json({ ok: true });
  }

  const statusMatch = path.match(/^\/admin\/posts\/(\d+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    let body;
    try { body = await request.json(); } catch { return error('Invalid JSON'); }
    const status = body?.status;
    if (!['draft','pending','published','archived'].includes(status)) return error('Invalid status');
    await env.DB.prepare(
      "UPDATE posts SET status = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(status, statusMatch[1]).run();
    return json({ ok: true });
  }

  return error('Not found', 404);
}
