PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_categories_slug ON categories(slug);

CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  imagekit_file_id TEXT NOT NULL,
  imagekit_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_media_created ON media(created_at);

CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  short_description TEXT,
  content TEXT,
  featured_image_id INTEGER REFERENCES media(id),
  featured_image_url TEXT,
  organization TEXT,
  post_name TEXT,
  total_vacancy TEXT,
  application_start_date TEXT,
  application_last_date TEXT,
  exam_date TEXT,
  result_date TEXT,
  salary TEXT,
  age_limit TEXT,
  application_fee TEXT,
  eligibility TEXT,
  selection_process TEXT,
  how_to_apply TEXT,
  important_dates TEXT,
  important_links TEXT,
  official_website TEXT,
  apply_link TEXT,
  notification_link TEXT,
  download_link TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  views INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created ON posts(created_at);
CREATE INDEX idx_posts_title ON posts(title);
CREATE INDEX idx_posts_organization ON posts(organization);
CREATE INDEX idx_posts_status_created ON posts(status, created_at DESC);

CREATE TABLE post_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_post_views_post ON post_views(post_id);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT
);

INSERT INTO categories (name, slug, description) VALUES
('Latest Jobs', 'jobs', 'Latest government job notifications and recruitments'),
('Results', 'results', 'Exam results and merit lists'),
('Admit Card', 'admit-card', 'Download admit cards and hall tickets'),
('Admission', 'admission', 'Admission notifications and entrance exams'),
('Scholarship', 'scholarship', 'Scholarships and financial aid'),
('Schemes', 'schemes', 'Government schemes and yojanas'),
('News', 'news', 'Latest news and updates');

INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'GovPortal'),
('tagline', 'Government Jobs, Results & Latest Updates'),
('seo_default_title', 'GovPortal — Government Jobs, Results & Latest Updates'),
('seo_default_description', 'Find the latest government jobs, exam results, admit cards, admissions, scholarships and important updates.'),
('contact_email', 'contact@example.com');
