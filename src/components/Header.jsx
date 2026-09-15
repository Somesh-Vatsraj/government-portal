import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import MobileMenu from './MobileMenu.jsx';
import SearchBox from './SearchBox.jsx';
import { AuthContext } from '../App.jsx';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <div className="header-top">
        <div className="container header-inner">
          <Link to="/" className="brand" aria-label="Home">
            <span className="brand-logo" aria-hidden="true">GP</span>
            <span className="brand-text">
              <strong>GovPortal</strong>
              <small>Jobs • Results • Updates</small>
            </span>
          </Link>

          <div className="header-search">
            <SearchBox />
          </div>

          <div className="header-actions">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="btn btn-outline btn-sm">Admin</Link>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            )}
            <button
              className="menu-toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </div>

      <div className="header-nav desktop-only">
        <div className="container">
          <Navbar />
        </div>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
