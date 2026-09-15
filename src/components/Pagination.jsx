import { Link } from 'react-router-dom';

export default function Pagination({ page, pages, makeHref }) {
  if (!pages || pages <= 1) return null;

  const prev = Math.max(1, page - 1);
  const next = Math.min(pages, page + 1);

  const nums = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link to={makeHref(prev)} className="page-btn" rel="prev">‹ Prev</Link>
      ) : <span className="page-btn disabled">‹ Prev</span>}

      {start > 1 && <>
        <Link to={makeHref(1)} className="page-btn">1</Link>
        {start > 2 && <span className="page-ellipsis">…</span>}
      </>}

      {nums.map((n) => (
        <Link
          key={n}
          to={makeHref(n)}
          className={`page-btn${n === page ? ' active' : ''}`}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </Link>
      ))}

      {end < pages && <>
        {end < pages - 1 && <span className="page-ellipsis">…</span>}
        <Link to={makeHref(pages)} className="page-btn">{pages}</Link>
      </>}

      {page < pages ? (
        <Link to={makeHref(next)} className="page-btn" rel="next">Next ›</Link>
      ) : <span className="page-btn disabled">Next ›</span>}
    </nav>
  );
}
