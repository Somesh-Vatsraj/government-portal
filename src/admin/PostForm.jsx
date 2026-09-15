import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api.js';
import ImageUploader from '../components/ImageUploader.jsx';
import MediaPicker from './MediaPicker.jsx';

const EMPTY = {
  title: '', slug: '', category_id: '', short_description: '', content: '',
  featured_image_id: null, featured_image_url: '',
  organization: '', post_name: '', total_vacancy: '',
  application_start_date: '', application_last_date: '', exam_date: '', result_date: '',
  salary: '', age_limit: '', application_fee: '',
  eligibility: '', selection_process: '', how_to_apply: '',
  important_dates: '', important_links: '',
  official_website: '', apply_link: '', notification_link: '', download_link: '',
  status: 'draft',
  seo_title: '', seo_description: '', seo_keywords: '', canonical_url: ''
};

export default function PostForm({ postId }) {
  const [data, setData] = useState(EMPTY);
  const [cats, setCats] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.adminListCategories().then((r) => setCats(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!postId) return;
    api.adminGetPost(postId)
      .then((r) => {
        setData({ ...EMPTY, ...r.post });
        if (r.post.featured_image_url) {
          setImage({
            id: r.post.featured_image_id,
            image_url: r.post.featured_image_url,
            file_name: 'featured image'
          });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [postId]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const submit = async (status) => {
    setError('');
    if (!data.title.trim()) return setError('Title is required');
    if (!data.category_id) return setError('Category is required');

    setSaving(true);
    try {
      const payload = {
        ...data,
        status: status || data.status,
        category_id: parseInt(data.category_id),
        featured_image_id: image?.id || null,
        featured_image_url: image?.image_url || null
      };
      let result;
      if (postId) result = await api.adminUpdatePost(postId, payload);
      else result = await api.adminCreatePost(payload);
      navigate('/admin/posts');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading…</div>;

  return (
    <div className="post-form">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        <div className="form-col-main">
          <section className="form-card">
            <h2>Basic</h2>
            <label>Title *<input value={data.title} onChange={(e) => set('title', e.target.value)} required /></label>
            <div className="row-2">
              <label>Category *
                <select value={data.category_id} onChange={(e) => set('category_id', e.target.value)} required>
                  <option value="">Select…</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>Slug
                <input value={data.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated" />
              </label>
            </div>
            <label>Short Description
              <textarea rows="3" value={data.short_description} onChange={(e) => set('short_description', e.target.value)} />
            </label>
          </section>

          <section className="form-card">
            <h2>Featured Image</h2>
            <ImageUploader
              value={image}
              onChange={setImage}
              onSelectExisting={() => setShowPicker(true)}
            />
          </section>

          <section className="form-card">
            <h2>Job Details</h2>
            <div className="row-2">
              <label>Organization<input value={data.organization} onChange={(e) => set('organization', e.target.value)} /></label>
              <label>Post Name<input value={data.post_name} onChange={(e) => set('post_name', e.target.value)} /></label>
              <label>Total Vacancy<input value={data.total_vacancy} onChange={(e) => set('total_vacancy', e.target.value)} /></label>
              <label>Salary<input value={data.salary} onChange={(e) => set('salary', e.target.value)} /></label>
              <label>Age Limit<input value={data.age_limit} onChange={(e) => set('age_limit', e.target.value)} /></label>
              <label>Application Fee<input value={data.application_fee} onChange={(e) => set('application_fee', e.target.value)} /></label>
            </div>
          </section>

          <section className="form-card">
            <h2>Dates</h2>
            <div className="row-2">
              <label>Application Start<input type="date" value={data.application_start_date || ''} onChange={(e) => set('application_start_date', e.target.value)} /></label>
              <label>Application Last Date<input type="date" value={data.application_last_date || ''} onChange={(e) => set('application_last_date', e.target.value)} /></label>
              <label>Exam Date<input type="date" value={data.exam_date || ''} onChange={(e) => set('exam_date', e.target.value)} /></label>
              <label>Result Date<input type="date" value={data.result_date || ''} onChange={(e) => set('result_date', e.target.value)} /></label>
            </div>
          </section>

          <section className="form-card">
            <h2>Content (HTML allowed)</h2>
            <label>Main Content
              <textarea rows="10" value={data.content} onChange={(e) => set('content', e.target.value)} />
            </label>
            <label>Eligibility
              <textarea rows="4" value={data.eligibility} onChange={(e) => set('eligibility', e.target.value)} />
            </label>
            <label>Selection Process
              <textarea rows="4" value={data.selection_process} onChange={(e) => set('selection_process', e.target.value)} />
            </label>
            <label>How To Apply
              <textarea rows="4" value={data.how_to_apply} onChange={(e) => set('how_to_apply', e.target.value)} />
            </label>
          </section>

          <section className="form-card">
            <h2>Links</h2>
            <div className="row-2">
              <label>Official Website<input value={data.official_website} onChange={(e) => set('official_website', e.target.value)} /></label>
              <label>Apply Link<input value={data.apply_link} onChange={(e) => set('apply_link', e.target.value)} /></label>
              <label>Notification Link<input value={data.notification_link} onChange={(e) => set('notification_link', e.target.value)} /></label>
              <label>Download Link<input value={data.download_link} onChange={(e) => set('download_link', e.target.value)} /></label>
            </div>
          </section>

          <section className="form-card">
            <h2>SEO</h2>
            <label>SEO Title<input value={data.seo_title} onChange={(e) => set('seo_title', e.target.value)} /></label>
            <label>SEO Description<textarea rows="2" value={data.seo_description} onChange={(e) => set('seo_description', e.target.value)} /></label>
            <label>SEO Keywords<input value={data.seo_keywords} onChange={(e) => set('seo_keywords', e.target.value)} /></label>
            <label>Canonical URL<input value={data.canonical_url} onChange={(e) => set('canonical_url', e.target.value)} /></label>
          </section>
        </div>

        <aside className="form-col-side">
          <section className="form-card sticky">
            <h2>Publish</h2>
            <label>Status
              <select value={data.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <div className="form-actions">
              <button className="btn btn-outline btn-block" disabled={saving} onClick={() => submit('draft')}>
                {saving ? '…' : 'Save Draft'}
              </button>
              <button className="btn btn-primary btn-block" disabled={saving} onClick={() => submit('published')}>
                {saving ? 'Publishing…' : 'Publish'}
              </button>
            </div>

            <p className="muted small">Only published posts appear on the public site.</p>
          </section>
        </aside>
      </div>

      {showPicker && (
        <MediaPicker
          onClose={() => setShowPicker(false)}
          onSelect={(m) => { setImage(m); setShowPicker(false); }}
        />
      )}
    </div>
  );
}
