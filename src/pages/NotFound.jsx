import { Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';

export default function NotFound() {
  return (
    <>
      <SEO title="404 — Not Found" description="The page you requested was not found." />
      <div className="container notfound">
        <h1>404</h1>
        <p>Oops! The page you requested does not exist.</p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </>
  );
}
