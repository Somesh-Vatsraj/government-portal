import { useContext } from 'react';
import { NavLink, Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App.jsx';

export default function AdminLayout() {
  const { user, ready, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!ready) return <div className="admin-loading">Loading…</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;

  const items = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '▤' },
    { to: '/admin/posts', label: 'Posts', icon: '📝' },
    { to: '/admin/posts/new', label: 'New Post', icon: '➕' },
    { to: '/admin/categories', label: 'Categories', icon: '🏷' },
    { to: '/admin/media', label: 'Media', icon: '🖼' },
    { to: '/admin/users', label: 'Users', icon: '👤' },
    { to: '/admin/settings', label: 'Settings', icon: '⚙' }
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin/dashboard" className="admin-brand">
          <span className="admin-brand-mark">GP</span>
          <span>GovPortal Admin</span>
        </Link>
        <nav>
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.to === '/admin/posts/new' ? false : undefined}
              className={({ isActive }) => `admin-nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-icon">{it.icon}</span>
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item"><span className="nav-icon">↗</span>View Site</Link>
          <button className="admin-nav-item as-button" onClick={async () => { await logout(); navigate('/admin/login'); }}>
            <span className="nav-icon">⎋</span>Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div>Welcome, {user.name}</div>
        </header>
        <div className="admin-content"><Outlet /></div>
      </main>
    </div>
  );
}
