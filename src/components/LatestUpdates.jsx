import { Link } from 'react-router-dom';
import PostCard from './PostCard.jsx';

export default function LatestUpdates({ title, posts, viewAllTo }) {
  if (!posts || posts.length === 0) return null;
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
        {viewAllTo && <Link to={viewAllTo} className="view-all">View All →</Link>}
      </div>
      <div className="post-grid">
        {posts.slice(0, 6).map((p) => <PostCard key={p.id} post={p} />)}
      </div>
    </section>
  );
}
