import { useEffect, useState } from 'react';
import { api } from '../api/api.js';

export default function MediaPicker({ onSelect, onClose }) {
  const [media, setMedia] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.adminListMedia(q).then((r) => setMedia(r.media)).catch(() => {}).finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Media Library</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <input
            className="modal-search"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {loading ? <p>Loading…</p> : (
            <div className="media-grid">
              {media.map((m) => (
                <button key={m.id} className="media-item" onClick={() => onSelect(m)}>
                  <img src={m.image_url} alt={m.alt_text || m.file_name} loading="lazy" />
                  <span>{m.file_name}</span>
                </button>
              ))}
              {!media.length && <p className="muted">No media</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
