import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { api } from '../api/api.js';
import { AuthContext } from '../App.jsx';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, ready } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && user?.role === 'admin') navigate('/admin/dashboard');
  }, [ready, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await api.login({ email, password });
      if (r.user.role !== 'admin') {
        setError('This account does not have admin access');
        setLoading(false);
        return;
      }
      login(r.token, r.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Admin Login — GovPortal" description="Admin login." />
      <div className="admin-login-wrap">
        <form className="admin-login-card" onSubmit={submit}>
          <div className="admin-login-brand">GP</div>
          <h1>Admin Panel</h1>
          <p className="muted">Sign in with your admin account</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </>
  );
}
