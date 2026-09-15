import { Link } from 'react-router-dom';

const shortcuts = [
  { to: '/jobs', label: 'Latest Jobs', icon: '💼' },
  { to: '/results', label: 'Results', icon: '📊' },
  { to: '/admit-card', label: 'Admit Cards', icon: '🎫' },
  { to: '/admission', label: 'Admissions', icon: '🎓' },
  { to: '/scholarship', label: 'Scholarships', icon: '🏅' },
  { to: '/schemes', label: 'Govt Schemes', icon: '🏛️' },
  { to: '/news', label: 'News', icon: '📰' }
];

export default function CategoryNav() {
  return (
    <div className="category-nav">
      {shortcuts.map((s) => (
        <Link key={s.to} to={s.to} className="category-chip">
          <span className="chip-icon" aria-hidden="true">{s.icon}</span>
          <span>{s.label}</span>
        </Link>
      ))}
    </div>
  );
}
