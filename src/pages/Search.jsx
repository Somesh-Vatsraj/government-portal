import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import PostList from '../components/PostList.jsx';
import Pagination from '../components/Pagination.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { api } from '../api/api.js';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1'));
  const category = params.get('category') || '';
  const [data, setData] = useState({ posts: [], pagination: { pages: 1 } });
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState([]);

  useEffect(() => { api.getCategories().then((r) => setCats(r.categories)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const req = {};
    if (q) req.q = q;
    if (category) req.category = category;
    req.page = page;
    api.search(req)
      .then(setData)
      .catch(() => setData({ posts: [], pagination: { pages: 1 } }))
      .finally(() => setLoading(false));
  }, [q, page, category]);

  const makeHref = (p) => {
    const sp = new URLSearchParams(params);
    if (p <= 1) sp.delete('page'); else sp.set('page', String(p));
    return `/search?${sp.toString()}`;
  };

  return (
    <>
      <SEO
        title={q ? `Search results for "${q}" — GovPortal` : 'Search — GovPortal'}
        description={`Search results for ${q || 'all posts'}.`}
        canonical={`${window.location.origin}/search`}
      />

      <div className="container">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />

        <div className="page-head">
          <h1>{q ? `Search results for "${q}"` : 'Search'}</h1>
          <p>{data.pagination?.total || 0} result(s) found</p>
        </div>

        <div className="search-filters">
          <div className="filter-row">
            <label>Category:
              <select
                value={category}
                onChange={(e) => {
                  const sp = new URLSearchParams(params);
                  if (e.target.value) sp.set('category', e.target.value);
                  else sp.delete('category');
                  sp.delete('page');
                  window.location.href = `/search?${sp.toString()}`;
                }}
              >
                <option value="">All Categories</option>
                {cats.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="layout-with-sidebar">
          <div className="main-col">
            <PostList
              posts={data.posts}
              loading={loading}
              empty={q ? `No results found for "${q}".` : 'Start typing to search.'}
            />
            <Pagination page={page} pages={data.pagination?.pages || 1} makeHref={makeHref} />
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
