import { useEffect, useState } from 'react';
import { api } from '../api/api.js';

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.adminListCategories().then((r) => setCats(r.categories)).catch(() => {});
  useEffect(() => { load(); }, []);

  const reset = () => { setEditing(null); setName(''); setDescription(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (editing) await api.adminUpdateCategory(editing, { name, description });
      else await api.adminCreateCategory({ name, description });
      reset(); load();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const edit = (c) => { setEditing(c.id); setName(c.name); setDescription(c.description || ''); };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.adminDeleteCategory(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <h1 className="admin-h1">Categories</h1>

      <form className="form-card inline-form" onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />
        <button className="btn btn-primary" disabled={busy}>{editing ? 'Update' : 'Add'}</button>
        {editing && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>}
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Slug</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td><code>{c.slug}</code></td>
                <td>{c.description}</td>
                <td className="actions-cell">
                  <button className="btn btn-ghost btn-xs" onClick={() => edit(c)}>Edit</button>
                  <button className="btn btn-danger btn-xs" onClick={() => remove(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
