import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import PostList from '../components/PostList.jsx';
import Pagination from '../components/Pagination.jsx';
import Sidebar from '../components/Sidebar.jsx';
import AdSlot from '../components/AdSlot.jsx';
import { api } from '../api/api.js';

const TITLES = {
  jobs: { h1: 'Latest Government Jobs', desc: 'Browse the newest government job notifications, recruitments and vacancies.' },
  results: { h1: 'Latest Exam Results', desc: 'Check the latest exam results and merit lists from government bodies.' },
  'admit-card': { h1: 'Admit Cards', desc: 'Download admit cards and hall tickets for upcoming exams.' },
  admission: { h1: 'Admissions', desc: 'Explore admission notifications and entrance examinations.' },
  scholarship: { h1: 'Scholarships', desc: 'Apply for scholarships and financial aid programs.' },
  schemes: { h1: 'Government Schemes', desc: 'Discover welfare schemes and benefits for citizens.' },
  news: { h1: 'Latest News', desc: 'Read the latest news and updates for students and job aspirants.' }
};

export default function CategoryPage() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const [data, setData] = useState({ posts: [], pagination: { pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);

  const meta = TITLES[category] || { h1: category, desc: '' };

  useEffect(() => {
    api.getCategories().then((r) => setCats(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getPosts({ category, page, limit: 12 })
      .then((r) => setData(r))
      .catch(() => setData({ posts: [], pagination: { pages: 1 } }))
      .finally(() => setLoading(false));
  }, [category, page]);

  const makeHref = (p) => {
    const sp = new URLSearchParams(searchParams);
    if (p <= 1) sp.delete('page'); else sp.set('page', String(p));
    const qs = sp.toString();
    return `/${category}${qs ? '?' + qs : ''}`;
  };

  const categoryObj = cats.find((c) => c.slug === category);

  return (
    <>
      <SEO
        title={`${meta.h1} — GovPortal`}
        description={meta.desc}
        canonical={`${window.location.origin}/${category}`}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: meta.h1,
          url: `${window.location.origin}/${category}`
        }}
      />

      <div className="container">
        <Breadcrumb items={[
          { label: 'Home', to: '/' },
          { label: categoryObj?.name || meta.h1 }
        ]} />

        <div className="page-head">
          <h1>{meta.h1}</h1>
          <p>{meta.desc}</p>
        </div>

        <div className="layout-with-sidebar">
          <div className="main-col">
            <AdSlot position="top-list" />
            <PostList posts={data.posts} loading={loading} empty="No posts published yet." />
            <Pagination page={page} pages={data.pagination?.pages || 1} makeHref={makeHref} />
          </div>
          <Sidebar />
        </div>
      </div>
    </>
  );
}
