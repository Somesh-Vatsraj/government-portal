import { json } from './database.js';

export async function handleSearch(request, env) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const category = url.searchParams.get('category');
  const organization = url.searchParams.get('organization');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = 15;
  const offset = (page - 1) * limit;

  const conditions = ["p.status = 'published'"];
  const params = [];

  if (q) {
    conditions.push('(p.title LIKE ? OR p.organization LIKE ? OR p.post_name LIKE ? OR p.short_description LIKE ? OR p.content LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (category) {
    conditions.push('c.slug = ?');
    params.push(category);
  }
  if (organization) {
    conditions.push('p.organization LIKE ?');
    params.push(`%${organization}%`);
  }

  const where = conditions.join(' AND ');

  const [rows, countRow] = await Promise.all([
    env.DB.prepare(
      `SELECT p.id, p.title, p.slug, p.short_description, p.featured_image_url,
              p.created_at, p.organization, c.name AS category_name, c.slug AS category_slug
       FROM posts p JOIN categories c ON c.id = p.category_id
       WHERE ${where}
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all(),
    env.DB.prepare(
      `SELECT COUNT(*) AS total FROM posts p JOIN categories c ON c.id = p.category_id WHERE ${where}`
    ).bind(...params).first()
  ]);

  return json({
    query: q,
    posts: rows.results,
    pagination: {
      page, limit,
      total: countRow?.total || 0,
      pages: Math.ceil((countRow?.total || 0) / limit)
    }
  });
}
