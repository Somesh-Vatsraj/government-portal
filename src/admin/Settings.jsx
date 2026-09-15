import { useState } from 'react';

export default function Settings() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    site_name: 'GovPortal',
    tagline: 'Government Jobs, Results & Latest Updates',
    primary_color: '#F4B400',
    contact_email: 'contact@example.com',
    social_twitter: '',
    social_facebook: '',
    seo_default_title: '',
    seo_default_description: '',
    gsc_verification: '',
    analytics_id: '',
    ads_enabled: 'true'
  });

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => { setSaving(false); alert('Settings saved locally. Connect a settings API to persist.'); }, 400);
  };

  return (
    <div>
      <h1 className="admin-h1">Settings</h1>
      <form className="form-card" onSubmit={save}>
        <div className="row-2">
          <label>Website Name<input value={settings.site_name} onChange={(e) => set('site_name', e.target.value)} /></label>
          <label>Tagline<input value={settings.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
          <label>Primary Color<input type="color" value={settings.primary_color} onChange={(e) => set('primary_color', e.target.value)} /></label>
          <label>Contact Email<input type="email" value={settings.contact_email} onChange={(e) => set('contact_email', e.target.value)} /></label>
          <label>Twitter URL<input value={settings.social_twitter} onChange={(e) => set('social_twitter', e.target.value)} /></label>
          <label>Facebook URL<input value={settings.social_facebook} onChange={(e) => set('social_facebook', e.target.value)} /></label>
        </div>

        <h2>SEO</h2>
        <label>Default SEO Title<input value={settings.seo_default_title} onChange={(e) => set('seo_default_title', e.target.value)} /></label>
        <label>Default SEO Description<textarea rows="2" value={settings.seo_default_description} onChange={(e) => set('seo_default_description', e.target.value)} /></label>
        <div className="row-2">
          <label>Google Search Console Verification<input value={settings.gsc_verification} onChange={(e) => set('gsc_verification', e.target.value)} /></label>
          <label>Analytics ID<input value={settings.analytics_id} onChange={(e) => set('analytics_id', e.target.value)} /></label>
        </div>

        <h2>Advertising</h2>
        <label>
          <input type="checkbox" checked={settings.ads_enabled === 'true'} onChange={(e) => set('ads_enabled', e.target.checked ? 'true' : 'false')} />
          {' '}Enable ad slots
        </label>

        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
      </form>
    </div>
  );
}
