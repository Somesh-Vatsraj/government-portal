import { json, error } from './database.js';
import { requireAuth } from './auth.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function handleMedia(request, env, path) {
  const user = await requireAuth(request, env, 'admin');
  if (!user) return error('Unauthorized', 401);
  const method = request.method;

  if (path === '/admin/media/upload' && method === 'POST') {
    return await handleUpload(request, env);
  }

  if (path === '/admin/media' && method === 'GET') {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') || '').trim();
    const rows = q
      ? await env.DB.prepare('SELECT * FROM media WHERE file_name LIKE ? ORDER BY created_at DESC LIMIT 200').bind(`%${q}%`).all()
      : await env.DB.prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT 200').all();
    return json({ media: rows.results });
  }

  const idMatch = path.match(/^\/admin\/media\/(\d+)$/);
  if (idMatch && method === 'DELETE') {
    const media = await env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(idMatch[1]).first();
    if (!media) return error('Not found', 404);

    const usage = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM posts WHERE featured_image_id = ?'
    ).bind(media.id).first();
    if (usage.c > 0) {
      return error(`This image is used by ${usage.c} post(s). Remove them first.`, 409);
    }

    // delete from ImageKit
    if (env.IMAGEKIT_PRIVATE_KEY && media.imagekit_file_id) {
      try {
        const auth = 'Basic ' + btoa(env.IMAGEKIT_PRIVATE_KEY + ':');
        await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(media.imagekit_file_id)}`, {
          method: 'DELETE',
          headers: { Authorization: auth }
        });
      } catch (e) {
        console.error('ImageKit delete failed', e);
      }
    }

    await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(media.id).run();
    return json({ ok: true });
  }

  return error('Not found', 404);
}

async function handleUpload(request, env) {
  const ct = request.headers.get('Content-Type') || '';
  if (!ct.includes('multipart/form-data')) return error('Expected multipart/form-data');

  let form;
  try { form = await request.formData(); } catch { return error('Invalid form data'); }

  const file = form.get('file');
  const altText = form.get('alt_text') || '';

  if (!file || typeof file === 'string') return error('No file uploaded');
  if (!ALLOWED_TYPES.includes(file.type)) return error('Only JPG, JPEG, PNG, WEBP allowed');
  if (file.size > MAX_SIZE) return error('File too large (max 5 MB)');

  const originalExt = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.includes(originalExt)) return error('Invalid file extension');

  if (!env.IMAGEKIT_PRIVATE_KEY) {
    return error('ImageKit is not configured. Please set IMAGEKIT_PRIVATE_KEY secret.', 500);
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 10);
  const fileName = `img-${Date.now()}-${rand}.${originalExt}`;
  const folder = `/posts/${year}/${month}`;

  const auth = 'Basic ' + btoa(env.IMAGEKIT_PRIVATE_KEY + ':');
  const ik = new FormData();
  ik.append('file', file, fileName);
  ik.append('fileName', fileName);
  ik.append('folder', folder);
  ik.append('useUniqueFileName', 'false');

  const resp = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: auth },
    body: ik
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error('ImageKit upload failed', resp.status, txt);
    return error('Image upload failed. Please try again.', 500);
  }

  const data = await resp.json();

  const result = await env.DB.prepare(
    `INSERT INTO media (file_name, imagekit_file_id, imagekit_path, image_url, mime_type,
                        file_size, width, height, alt_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    fileName,
    data.fileId,
    data.filePath,
    data.url,
    file.type,
    data.size || file.size,
    data.width || null,
    data.height || null,
    altText || null
  ).run();

  const media = await env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(result.meta.last_row_id).first();
  return json({ media });
}
