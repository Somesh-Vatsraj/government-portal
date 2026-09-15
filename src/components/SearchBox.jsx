import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBox({ placeholder = 'Search jobs, results, exams...', compact = false }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <form className={`searchbox${compact ? ' compact' : ''}`} onSubmit={submit} role="search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
      />
      <button type="submit" className="btn btn-primary" aria-label="Search">Search</button>
    </form>
  );
}
