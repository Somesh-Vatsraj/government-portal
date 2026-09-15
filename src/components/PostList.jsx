import PostCard from './PostCard.jsx';
import Loading from './Loading.jsx';

export default function PostList({ posts, loading, empty = 'No posts found.' }) {
  if (loading) return <Loading />;
  if (!posts || posts.length === 0) {
    return (
      <div className="empty-state">
        <p>{empty}</p>
      </div>
    );
  }
  return (
    <div className="post-grid">
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
}
