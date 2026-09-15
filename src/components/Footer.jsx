import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <div className="footer-brand">GovPortal</div>
          <p>Find the latest government jobs, results, admit cards, admissions, scholarships and updates.</p>
        </div>
        <div className="footer-col">
          <h4>Categories</h4>
          <ul>
            <li><Link to="/jobs">Latest Jobs</Link></li>
            <li><Link to="/results">Results</Link></li>
            <li><Link to="/admit-card">Admit Cards</Link></li>
            <li><Link to="/admission">Admissions</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>More</h4>
          <ul>
            <li><Link to="/scholarship">Scholarships</Link></li>
            <li><Link to="/schemes">Schemes</Link></li>
            <li><Link to="/news">News</Link></li>
            <li><Link to="/search">Search</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4>Disclaimer</h4>
          <p className="muted">
            This is a demo portal. Information is provided as-is and must be verified on official
            government websites. We are not affiliated with any government body.
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <span>© {new Date().getFullYear()} GovPortal. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
