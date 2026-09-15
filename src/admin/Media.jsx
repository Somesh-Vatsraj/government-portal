import { useEffect, useState } from 'react';
import { api } from '../api/api.js';

export default function Media() {
  const [media, setMedia] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const load = () => {
    setLoading(true);
    api.adminListMedia(q).then((r) => setMedia(r.media)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [q]);

  const upload = async (e) => {
    const files = e.target.files;
    e.target.value = '';
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        await api.adminUploadMedia(f, '', setProgress);
      }
      load();
    } catch (err) { alert(err.message); }
    finally { setUploading(false); setProgress(0); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this media?')) return;
    try { await api.adminDeleteMedia(id); load(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1 className="admin-h1">Media Library</h1>
        <label className="btn btn-primary">
          {uploading ? `Uploading ${progress}%` : '+ Upload'}
          <input type="file" accept="image/*" multiple hidden onChange={upload} />
        </label>
      </div>

      <div className="admin-toolbar">
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? <p>Loading…</p> : (
        <div className="media-grid admin-media-grid">
          {media.map((m) => (
            <div key={m.id} className="media-card">
              <img src={m.image_url} alt={m.alt_text || m.file_name} loading="lazy" />
              <div className="media-meta">
                <span className="media-name" title={m.file_name}>{m.file_name}</span>
                <span className="muted small">{m.width}×{m.height} • {(m.file_size / 1024).toFixed(0)} KB</span>
              </div>
              <div className="media-actions">
                <button className="btn btn-danger btn-xs" onClick={() => remove(m.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!media.length && <p className="muted">No media</p>}
        </div>
      )}
    </div>
  );
}
