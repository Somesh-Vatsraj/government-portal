import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Home', end: true },
  { to: '/jobs', label: 'Latest Jobs' },
  { to: '/results', label: 'Results' },
  { to: '/admit-card', label: 'Admit Card' },
  { to: '/admission', label: 'Admission' },
  { to: '/scholarship', label: 'Scholarship' },
  { to: '/schemes', label: 'Schemes' },
  { to: '/news', label: 'News' }
];

export default function Navbar({ onNavigate }) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          onClick={onNavigate}
          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
        >
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}
