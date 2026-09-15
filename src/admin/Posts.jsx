import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/api.js';
import Pagination from '../components/Pagination.jsx';

export default function Posts() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1'));
  const status = params.get('status') || '';
  const q = params.get('q') || '';

  const [data, setData] = useState({ posts: [], pagination: { pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);

  const load = () => {
    setLoading(true);
    const req = { page };
    if (status) req.status = status;
    if (q) req.q = q;
    api.adminListPosts(req)
      .then(setData)
      .catch(() => setData({ posts: [], pagination: { pages: 1 } }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, status, q]);

  const apply = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    next.delete('page');
    setParams(next);
  };

  const remove = async (id, title) => {
    if (!confirm(`Delete post "${title}"?`)) return;
    try { await api.adminDeletePost(id); load(); } catch (e) { alert(e.message); }
  };

  const setStatusFor = async (id, s) => {
    try { await api.adminSetStatus(id, s); load(); } catch (e) { alert(e.message); }
  };

  const makeHref = (p) => {
    const sp = new URLSearchParams(params);
    if (p <= 1) sp.delete('page'); else sp.set('page', String(p));
    return `/admin/posts?${sp.toString()}`;
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">Posts</h1>
        <Link to="/admin/posts/new" className="btn btn-primary">+ New Post</Link>
      </div>

      <div className="admin-toolbar">
        <form onSubmit={(e) => { e.preventDefault(); apply({ q: search.trim() || '' }); }} className="admin-search">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts…" />
          <button className="btn btn-outline btn-sm">Search</button>
        </form>
        <div className="admin-filters">
          {['', 'published', 'draft', 'pending', 'archived'].map((s) => (
            <button
              key={s || 'all'}
              className={`chip${status === s ? ' active' : ''}`}
              onClick={() => apply({ status: s })}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Category</th><th>Status</th><th>Views</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6">Loading…</td></tr> :
              data.posts.length ? data.posts.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.category_name}</td>
                  <td><span className={`status status-${p.status}`}>{p.status}</span></td>
                  <td>{p.views}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <Link to={`/admin/posts/${p.id}/edit`} className="btn btn-ghost btn-xs">Edit</Link>
                    {p.status !== 'published' && (
                      <button className="btn btn-success btn-xs" onClick={() => setStatusFor(p.id, 'published')}>Publish</button>
                    )}
                    {p.status === 'published' && (
                      <button className="btn btn-outline btn-xs" onClick={() => setStatusFor(p.id, 'draft')}>Unpublish</button>
                    )}
                    <button className="btn btn-danger btn-xs" onClick={() => remove(p.id, p.title)}>Delete</button>
                  </td>
                </tr>
              )) : <tr><td colSpan="6" className="muted">No posts</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pages={data.pagination?.pages || 1} makeHref={makeHref} />
    </div>
  );
}
