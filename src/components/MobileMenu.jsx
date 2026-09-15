import { NavLink, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar.jsx';

export default function MobileMenu({ open, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div className={`drawer-backdrop${open ? ' show' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="drawer-header">
          <span className="brand-text"><strong>GovPortal</strong></span>
          <button className="icon-btn" onClick={onClose} aria-label="Close menu">✕</button>
        </div>
        <div className="drawer-body">
          <Navbar onNavigate={onClose} />
          <div className="drawer-links">
            <Link to="/search" onClick={onClose}>Advanced Search</Link>
            <Link to="/login" onClick={onClose}>Login</Link>
            <Link to="/register" onClick={onClose}>Register</Link>
          </div>
        </div>
      </aside>
    </>
  );
}
