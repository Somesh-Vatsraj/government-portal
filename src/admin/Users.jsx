import { useEffect, useState } from 'react';
import { api } from '../api/api.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [busy, setBusy] = useState(false);

  const load = () => api.adminListUsers().then((r) => setUsers(r.users)).catch(() => {});
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.adminCreateUser(form); setForm({ name: '', email: '', password: '', role: 'user' }); load(); }
    catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await api.adminDeleteUser(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <h1 className="admin-h1">Users</h1>

      <form className="form-card inline-form" onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-primary" disabled={busy}>Add User</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`status status-${u.role === 'admin' ? 'published' : 'draft'}`}>{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td><button className="btn btn-danger btn-xs" onClick={() => remove(u.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
