import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { api } from '../api/api.js';
import { AuthContext } from '../App.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.login({ email, password });
      login(r.token, r.user);
      navigate(r.user.role === 'admin' ? '/admin/dashboard' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Login — GovPortal" description="Login to your GovPortal account." />
      <div className="auth-wrap">
        <form className="auth-card" onSubmit={submit}>
          <h1>Login</h1>
          <p className="muted">Access your account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      </div>
    </>
  );
}
