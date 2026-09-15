import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import SearchBox from '../components/SearchBox.jsx';
import CategoryNav from '../components/CategoryNav.jsx';
import PostCard from '../components/PostCard.jsx';
import Sidebar from '../components/Sidebar.jsx';
import AdSlot from '../components/AdSlot.jsx';
import Loading from '../components/Loading.jsx';
import { api } from '../api/api.js';

export default function Home() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLatest()
      .then((r) => setLatest(r.latest))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sections = [
    { key: 'jobs', title: 'Latest Jobs', to: '/jobs' },
    { key: 'results', title: 'Latest Results', to: '/results' },
    { key: 'admit-card', title: 'Latest Admit Cards', to: '/admit-card' },
    { key: 'admission', title: 'Admissions', to: '/admission' },
    { key: 'scholarship', title: 'Scholarships', to: '/scholarship' },
    { key: 'schemes', title: 'Government Schemes', to: '/schemes' },
    { key: 'news', title: 'Latest News', to: '/news' }
  ];

  return (
    <>
      <SEO
        title="GovPortal — Government Jobs, Results & Latest Updates"
        description="Find the latest government jobs, exam results, admit cards, admissions, scholarships and important updates."
        canonical={window.location.origin + '/'}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'GovPortal',
          url: window.location.origin,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${window.location.origin}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        }}
      />

      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Government Jobs, Results & Latest Updates</h1>
          <p className="hero-subtitle">
            Find the latest government jobs, exam results, admit cards, admissions,
            scholarships and important updates.
          </p>
          <div className="hero-search"><SearchBox placeholder="Search jobs, results, exams, notifications..." /></div>
          <CategoryNav />
        </div>
      </section>

      <AdSlot position="header" />

      <div className="container layout-with-sidebar">
        <div className="main-col">
          {loading ? <Loading rows={3} /> : sections.map((s) => {
            const list = latest?.[s.key] || [];
            if (!list.length) return null;
            return (
              <section key={s.key} className="section">
                <div className="section-header">
                  <h2>{s.title}</h2>
                  <Link to={s.to} className="view-all">View All →</Link>
                </div>
                <div className="post-grid">
                  {list.slice(0, 6).map((p) => <PostCard key={p.id} post={p} />)}
                </div>
              </section>
            );
          })}
        </div>

        <Sidebar />
      </div>
    </>
  );
}
