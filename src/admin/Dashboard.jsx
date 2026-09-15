import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, pending: 0, users: 0, views: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.adminListPosts({ limit: 200 }),
      api.adminListUsers(),
      api.adminListPosts({ status: 'published', limit: 1 }),
      api.adminListPosts({ status: 'draft', limit: 1 }),
      api.adminListPosts({ status: 'pending', limit: 1 })
    ]).then(([all, users, pub, draft, pend]) => {
      const posts = all.posts || [];
      setStats({
        total: all.pagination.total,
        published: pub.pagination.total,
        draft: draft.pagination.total,
        pending: pend.pagination.total,
        users: users.users.length,
        views: posts.reduce((sum, p) => sum + (p.views || 0), 0)
      });
      setRecent(posts.slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Total Posts', value: stats.total, icon: '📚', to: '/admin/posts' },
    { label: 'Published', value: stats.published, icon: '✅', to: '/admin/posts?status=published' },
    { label: 'Draft', value: stats.draft, icon: '📝', to: '/admin/posts?status=draft' },
    { label: 'Pending', value: stats.pending, icon: '⏳', to: '/admin/posts?status=pending' },
    { label: 'Users', value: stats.users, icon: '👥', to: '/admin/users' },
    { label: 'Total Views', value: stats.views, icon: '👁', to: '/admin/posts' }
  ];

  return (
    <div>
      <h1 className="admin-h1">Dashboard</h1>
      {loading ? <div className="admin-loading">Loading…</div> : (
        <>
          <div className="stat-grid">
            {cards.map((c) => (
              <Link key={c.label} to={c.to} className="stat-card">
                <div className="stat-icon">{c.icon}</div>
                <div className="stat-value">{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </Link>
            ))}
          </div>

          <section className="admin-section">
            <div className="admin-section-header">
              <h2>Recent Posts</h2>
              <Link to="/admin/posts" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Title</th><th>Category</th><th>Status</th><th>Views</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id}>
                      <td>{p.title}</td>
                      <td>{p.category_name}</td>
                      <td><span className={`status status-${p.status}`}>{p.status}</span></td>
                      <td>{p.views}</td>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td><Link to={`/admin/posts/${p.id}/edit`} className="btn btn-ghost btn-xs">Edit</Link></td>
                    </tr>
                  ))}
                  {!recent.length && <tr><td colSpan="6" className="muted">No posts yet</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
