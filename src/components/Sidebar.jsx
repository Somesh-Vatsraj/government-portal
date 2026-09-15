import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api.js';
import AdSlot from './AdSlot.jsx';

export default function Sidebar() {
  const [latest, setLatest] = useState(null);
  const [cats, setCats] = useState([]);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    api.getLatest().then((r) => setLatest(r.latest)).catch(() => {});
    api.getCategories().then((r) => setCats(r.categories)).catch(() => {});
    api.getPosts({ limit: 6 }).then((r) => {
      const sorted = [...r.posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
      setPopular(sorted);
    }).catch(() => {});
  }, []);

  const allLatest = latest
    ? Object.values(latest).flat()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6)
    : [];

  return (
    <aside className="sidebar">
      <section className="widget">
        <h3 className="widget-title">Latest Updates</h3>
        <ul className="widget-list">
          {allLatest.map((p) => (
            <li key={`${p.category_slug}-${p.id}`}>
              <Link to={`/${p.category_slug}/${p.slug}`}>{p.title}</Link>
            </li>
          ))}
          {!allLatest.length && <li className="muted">No updates yet</li>}
        </ul>
      </section>

      <AdSlot position="sidebar" />

      <section className="widget">
        <h3 className="widget-title">Popular Posts</h3>
        <ul className="widget-list">
          {popular.map((p) => (
            <li key={p.id}>
              <Link to={`/${p.category_slug}/${p.slug}`}>{p.title}</Link>
            </li>
          ))}
          {!popular.length && <li className="muted">No posts yet</li>}
        </ul>
      </section>

      <section className="widget">
        <h3 className="widget-title">Categories</h3>
        <ul className="widget-list">
          {cats.map((c) => (
            <li key={c.id}>
              <Link to={`/${c.slug}`}>{c.name}</Link>
            </li>
          ))}
        </ul>
      </section>

      <AdSlot position="sidebar-bottom" />
    </aside>
  );
}
