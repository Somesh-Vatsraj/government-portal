import { Link } from 'react-router-dom';

export default function PostCard({ post, compact = false }) {
  const cat = post.category_slug || '';
  const url = cat ? `/${cat}/${post.slug}` : `/post/${post.slug}`;
  const date = post.created_at ? new Date(post.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  return (
    <article className={`post-card${compact ? ' compact' : ''}`}>
      <Link to={url} className="post-card-link" aria-label={post.title}>
        <div className="post-card-thumb">
          {post.featured_image_url ? (
            <img
              src={post.featured_image_url}
              alt={post.title}
              loading="lazy"
              width="320"
              height="200"
            />
          ) : (
            <div className="thumb-placeholder" aria-hidden="true">
              <span>{post.category_name?.[0] || 'P'}</span>
            </div>
          )}
          {post.category_name && <span className="badge badge-cat">{post.category_name}</span>}
        </div>
        <div className="post-card-body">
          <h3 className="post-card-title">{post.title}</h3>
          {!compact && post.short_description && (
            <p className="post-card-desc">{post.short_description}</p>
          )}
          <div className="post-card-meta">
            {date && <span>{date}</span>}
            {post.organization && <span>• {post.organization}</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
