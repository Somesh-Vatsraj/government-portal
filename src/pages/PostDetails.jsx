import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import PostCard from '../components/PostCard.jsx';
import ImportantLinks from '../components/ImportantLinks.jsx';
import AdSlot from '../components/AdSlot.jsx';
import Loading from '../components/Loading.jsx';
import NotFound from './NotFound.jsx';
import { api } from '../api/api.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmt(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

export default function PostDetails() {
  const { category, slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.getPost(slug)
      .then((r) => setData(r))
      .catch((e) => { if (e.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="container"><Loading rows={3} /></div>;
  if (notFound || !data) return <NotFound />;

  const { post, related } = data;
  const canonical = `${window.location.origin}/${post.category_slug}/${post.slug}`;
  const isJob = post.category_slug === 'jobs';
  const isNews = post.category_slug === 'news';

  const jsonLd = isJob
    ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: post.title,
        description: post.short_description || post.title,
        datePosted: post.created_at,
        validThrough: post.application_last_date || undefined,
        employmentType: 'FULL_TIME',
        hiringOrganization: post.organization ? { '@type': 'Organization', name: post.organization } : undefined,
        jobLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'IN' } },
        url: canonical
      }
    : isNews
    ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.short_description || '',
        image: post.featured_image_url || undefined,
        datePublished: post.created_at,
        dateModified: post.updated_at || post.created_at,
        mainEntityOfPage: canonical
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.short_description || '',
        datePublished: post.created_at,
        mainEntityOfPage: canonical
      };

  const importantDates = [];
  if (post.application_start_date) importantDates.push(['Application Start', fmt(post.application_start_date)]);
  if (post.application_last_date) importantDates.push(['Application Last Date', fmt(post.application_last_date)]);
  if (post.exam_date) importantDates.push(['Exam Date', fmt(post.exam_date)]);
  if (post.result_date) importantDates.push(['Result Date', fmt(post.result_date)]);

  return (
    <>
      <SEO
        title={post.seo_title || `${post.title} — GovPortal`}
        description={post.seo_description || post.short_description}
        keywords={post.seo_keywords}
        canonical={post.canonical_url || canonical}
        image={post.featured_image_url}
        type="article"
        jsonLd={jsonLd}
      />

      <div className="container">
        <Breadcrumb items={[
          { label: 'Home', to: '/' },
          { label: post.category_name, to: `/${post.category_slug}` },
          { label: post.title }
        ]} />

        <div className="layout-with-sidebar">
          <div className="main-col">
            <article className="post-detail">
              <header className="post-detail-header">
                <span className="badge badge-cat">{post.category_name}</span>
                <h1>{post.title}</h1>
                <div className="post-meta">
                  <span>Published: {fmt(post.created_at)}</span>
                  {post.updated_at && post.updated_at !== post.created_at && (
                    <span>Updated: {fmt(post.updated_at)}</span>
                  )}
                  <span>👁 {post.views} views</span>
                </div>
                {post.short_description && (
                  <p className="post-summary">{post.short_description}</p>
                )}
              </header>

              {post.featured_image_url && (
                <figure className="post-image">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    width="900"
                    height="500"
                    loading="eager"
                  />
                </figure>
              )}

              <AdSlot position="article-top" />

              {post.organization && (
                <div className="fact-grid">
                  {post.organization && <div><span>Organization</span><strong>{post.organization}</strong></div>}
                  {post.post_name && <div><span>Post Name</span><strong>{post.post_name}</strong></div>}
                  {post.total_vacancy && <div><span>Total Vacancy</span><strong>{post.total_vacancy}</strong></div>}
                  {post.salary && <div><span>Salary</span><strong>{post.salary}</strong></div>}
                  {post.age_limit && <div><span>Age Limit</span><strong>{post.age_limit}</strong></div>}
                  {post.application_fee && <div><span>Application Fee</span><strong>{post.application_fee}</strong></div>}
                </div>
              )}

              {importantDates.length > 0 && (
                <section className="post-section">
                  <h2>Important Dates</h2>
                  <table className="info-table">
                    <tbody>
                      {importantDates.map(([k, v]) => (
                        <tr key={k}><th>{k}</th><td>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {post.content && (
                <section className="post-section">
                  <h2>Details</h2>
                  <div className="post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
                </section>
              )}

              {post.eligibility && (
                <section className="post-section">
                  <h2>Eligibility</h2>
                  <div className="post-content" dangerouslySetInnerHTML={{ __html: post.eligibility }} />
                </section>
              )}

              {post.selection_process && (
                <section className="post-section">
                  <h2>Selection Process</h2>
                  <div className="post-content" dangerouslySetInnerHTML={{ __html: post.selection_process }} />
                </section>
              )}

              {post.how_to_apply && (
                <section className="post-section">
                  <h2>How to Apply</h2>
                  <div className="post-content" dangerouslySetInnerHTML={{ __html: post.how_to_apply }} />
                </section>
              )}

              <AdSlot position="article-bottom" />

              <ImportantLinks post={post} />

              {related?.length > 0 && (
                <section className="related-posts">
                  <h2>Related Posts</h2>
                  <div className="post-grid">
                    {related.map((p) => (
                      <PostCard
                        key={p.id}
                        post={{ ...p, category_slug: post.category_slug, category_name: post.category_name }}
                        compact
                      />
                    ))}
                  </div>
                </section>
              )}
            </article>
          </div>

          <aside className="sidebar">
            <AdSlot position="sidebar-post" />
            <section className="widget">
              <h3 className="widget-title">Quick Links</h3>
              <ul className="widget-list">
                <li><Link to="/jobs">Latest Jobs</Link></li>
                <li><Link to="/results">Results</Link></li>
                <li><Link to="/admit-card">Admit Cards</Link></li>
                <li><Link to="/admission">Admissions</Link></li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
