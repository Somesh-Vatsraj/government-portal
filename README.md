# GovPortal — Government Jobs, Results & News Portal

A production-ready government jobs, results, admit-card, admission, scholarship,
schemes and news portal. Built with **React + Vite** on the frontend and
**Cloudflare Workers + D1** on the backend, with **ImageKit** for image storage.

> ⚠️ This project contains **demo/sample content** for development. It is not
> affiliated with any government body. Sample posts are clearly marked as demo.

---

## 1. Features

- Public portal: Home, Jobs, Results, Admit Cards, Admissions, Scholarships,
  Schemes, News, Search, Post details.
- Admin panel: Dashboard, Posts (CRUD + publish workflow), Categories, Media
  Library, Users, Settings.
- Image upload via ImageKit (server-side signed upload from Worker).
- D1 database with full schema, indexes and foreign keys.
- SEO: dynamic titles/meta/canonical/OG/Twitter, structured data
  (JobPosting/Article), breadcrumbs, `sitemap.xml`, `robots.txt`.
- Mobile-first responsive UI. Custom CSS only.
- Secure auth (PBKDF2 + signed tokens).

---

## 2. Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, React Router 6    |
| Styling    | Custom CSS                        |
| Backend    | Cloudflare Workers                |
| Database   | Cloudflare D1 (SQLite)            |
| Images     | ImageKit (URL stored in D1)       |
| Auth       | PBKDF2 password hashing + HMAC tokens |

---

## 3. Prerequisites

- Node.js 18+
- Wrangler CLI
- Cloudflare account (Workers + D1)
- ImageKit account (Private Key)

---

## 4. Install

```bash
npm install
```

---

## 5. Local Development

### 5.1. Create D1 database

```bash
npx wrangler d1 create gov-portal-db
```

Copy the returned `database_id` into `wrangler.toml`.

### 5.2. Apply migrations locally

```bash
npm run db:migrate:local
```

This applies `migrations/001_initial.sql` and `migrations/002_seed.sql`.

### 5.3. Set local dev secrets

Create `.dev.vars` (do NOT commit):

```
AUTH_SECRET=some-long-random-string
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

### 5.4. Run

Terminal A — Worker:
```bash
npm run worker:dev
```

Terminal B — Vite:
```bash
npm run dev
```

Vite serves `http://localhost:5173` and proxies `/api` to the Worker at
`http://127.0.0.1:8787`.

---

## 6. First Admin Account

Register through the public UI (`/register`). The **first** user created
becomes **admin**. All subsequent registrations default to `user`.

Alternatively, use the admin login at `/admin/login` after registration.

---

## 7. Environment Variables / Secrets

Set these for production using `wrangler secret put`:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put IMAGEKIT_PRIVATE_KEY
```

Set these as plain vars in `wrangler.toml`:

```toml
[vars]
IMAGEKIT_PUBLIC_KEY = "your_public_key"
IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/your_id"
SITE_URL = "https://yourdomain.com"
```

**Never expose `IMAGEKIT_PRIVATE_KEY` or `AUTH_SECRET` to the frontend.**

---

## 8. How Image Upload Works

1. Admin selects an image in the post editor.
2. React sends the file to `POST /api/admin/media/upload` as `multipart/form-data`.
3. The Worker:
   - authenticates the admin,
   - validates MIME type, extension and size (≤ 5 MB),
   - forwards the file to ImageKit with Basic Auth using `IMAGEKIT_PRIVATE_KEY`,
   - receives `{ url, fileId, filePath, width, height, size }`,
   - stores URL + metadata in the `media` table in D1.
4. The post references `featured_image_id` + `featured_image_url`.
5. No manual URL copying is ever required.

Deletion is blocked when the image is referenced by any post.

---

## 9. How SEO Works

- `SEO.jsx` sets title, meta description, canonical, OpenGraph and Twitter
  tags per page.
- Structured data is injected per post:
  - `JobPosting` on `/jobs/*`
  - `Article` on `/news/*` and other categories
- `sitemap.xml` is generated dynamically by the Worker and contains only
  `published` posts.
- `robots.txt` is served by the Worker.

---

## 10. Production Deployment

### 10.1. Apply migrations to remote D1

```bash
npm run db:migrate
```

### 10.2. Build the frontend

```bash
npm run build
```

### 10.3. Deploy the Worker + assets

```bash
npm run worker:deploy
```

Wrangler serves `./dist` as static assets and routes `/api/*`,
`/sitemap.xml`, `/robots.txt` to your Worker.

Set a custom domain in the Cloudflare dashboard if desired.

---

## 11. API Reference

### Public
- `GET  /api/posts?category=&page=&limit=`
- `GET  /api/posts/:slug`
- `GET  /api/categories`
- `GET  /api/search?q=&category=&organization=&page=`
- `GET  /api/latest`
- `GET  /api/settings`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Admin (Bearer admin token required)
- `GET    /api/admin/posts`
- `POST   /api/admin/posts`
- `GET    /api/admin/posts/:id`
- `PUT    /api/admin/posts/:id`
- `DELETE /api/admin/posts/:id`
- `PATCH  /api/admin/posts/:id/status`
- `GET    /api/admin/categories`
- `POST   /api/admin/categories`
- `PUT    /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET    /api/admin/users`
- `POST   /api/admin/users`
- `DELETE /api/admin/users/:id`
- `POST   /api/admin/media/upload`
- `GET    /api/admin/media?q=`
- `DELETE /api/admin/media/:id`

### Sitemap
- `GET /sitemap.xml`
- `GET /robots.txt`

---

## 12. Directory Overview

- `src/pages` — public site pages
- `src/admin` — admin panel pages
- `src/components` — shared UI (Header, Sidebar, PostCard, SEO, etc.)
- `src/api/api.js` — fetch wrapper
- `src/styles` — custom CSS
- `worker/` — Cloudflare Worker modules
- `migrations/` — D1 migrations
- `public/` — static assets

---

## 13. Security Notes

- Passwords are hashed with PBKDF2 (SHA-256, 100 000 iterations, 16-byte salt).
- Auth uses HMAC-SHA256 signed tokens (7-day expiry).
- Admin API endpoints require a valid admin token.
- Image MIME, extension and size are validated server-side.
- D1 queries use prepared statements (`env.DB.prepare().bind()`).
- Secrets are stored via Wrangler secrets and never exposed to the browser.

---

## 14. License

MIT — you may adapt this project for your own portal.
