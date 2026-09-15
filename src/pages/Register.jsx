import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import { api } from '../api/api.js';
import { AuthContext } from '../App.jsx';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const r = await api.register({ name, email, password });
      login(r.token, r.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Register — GovPortal" description="Create your GovPortal account." />
      <div className="auth-wrap">
        <form className="auth-card" onSubmit={submit}>
          <h1>Create Account</h1>
          <p className="muted">The first registered user becomes admin.</p>

          {error && <div className="alert alert-error">{error}</div>}

          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>

          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </>
  );
}
