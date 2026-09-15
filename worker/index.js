import { handleAuth } from './auth.js';
import { handlePosts } from './posts.js';
import { handleCategories } from './categories.js';
import { handleUsers } from './users.js';
import { handleMedia } from './media.js';
import { handleSearch } from './search.js';
import { json, error } from './database.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
      return new Response(null, { headers: CORS });
    }

    try {
      // robots.txt
      if (path === '/robots.txt') {
        const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/private\n\nSitemap: ${url.origin}/sitemap.xml\n`;
        return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
      }

      // sitemap.xml
      if (path === '/sitemap.xml') {
        return await sitemap(url.origin, env);
      }

      // API
      if (path.startsWith('/api/')) {
        const apiPath = path.slice(4); // e.g. /auth/login
        let res;

        if (apiPath.startsWith('/auth')) {
          res = await handleAuth(request, env, apiPath);
        } else if (apiPath.startsWith('/admin/media')) {
          res = await handleMedia(request, env, apiPath);
        } else if (apiPath.startsWith('/admin/posts')) {
          res = await handlePosts(request, env, apiPath, true);
        } else if (apiPath.startsWith('/admin/categories')) {
          res = await handleCategories(request, env, apiPath, true);
        } else if (apiPath.startsWith('/admin/users')) {
          res = await handleUsers(request, env, apiPath);
        } else if (apiPath.startsWith('/posts')) {
          res = await handlePosts(request, env, apiPath, false);
        } else if (apiPath.startsWith('/categories')) {
          res = await handleCategories(request, env, apiPath, false);
        } else if (apiPath.startsWith('/search')) {
          res = await handleSearch(request, env);
        } else if (apiPath === '/latest') {
          res = await latest(env);
        } else if (apiPath === '/settings') {
          res = await publicSettings(env);
        } else {
          res = error('Not found', 404);
        }

        const headers = new Headers(res.headers);
        for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
        return new Response(res.body, { status: res.status, headers });
      }

      // Static assets
      return await env.ASSETS.fetch(request);
    } catch (e) {
      console.error('Worker error:', e);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS }
      });
    }
  }
};

async function latest(env) {
  const cats = ['jobs', 'results', 'admit-card', 'admission', 'scholarship', 'schemes', 'news'];
  const result = {};
  for (const slug of cats) {
    const rows = await env.DB.prepare(
      `SELECT p.id, p.title, p.slug, p.featured_image_url, p.short_description,
              p.created_at, c.name AS category_name, c.slug AS category_slug
       FROM posts p JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'published' AND c.slug = ?
       ORDER BY p.created_at DESC LIMIT 6`
    ).bind(slug).all();
    result[slug] = rows.results;
  }
  return json({ latest: result });
}

async function publicSettings(env) {
  const rows = await env.DB.prepare('SELECT setting_key, setting_value FROM settings').all();
  const obj = {};
  for (const r of rows.results) obj[r.setting_key] = r.setting_value;
  return json({ settings: obj });
}

async function sitemap(origin, env) {
  const posts = await env.DB.prepare(
    `SELECT p.slug, c.slug AS category_slug, p.updated_at
     FROM posts p JOIN categories c ON c.id = p.category_id
     WHERE p.status = 'published'
     ORDER BY p.updated_at DESC`
  ).all();
  const cats = await env.DB.prepare('SELECT slug FROM categories').all();

  const urls = [];
  urls.push(`<url><loc>${origin}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`);
  for (const c of cats.results) {
    urls.push(`<url><loc>${origin}/${c.slug}</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>`);
  }
  for (const p of posts.results) {
    const lastmod = (p.updated_at || '').slice(0, 10);
    urls.push(
      `<url><loc>${origin}/${p.category_slug}/${p.slug}</loc>` +
      (lastmod ? `<lastmod>${lastmod}</lastmod>` : '') +
      `<changefreq>weekly</changefreq><priority>0.7</priority></url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=1800'
    }
  });
}
