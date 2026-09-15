const BASE = '/api';

function getToken() {
  return localStorage.getItem('gp_token') || '';
}

async function request(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...opts, headers });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // public
  getPosts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/posts${qs ? '?' + qs : ''}`);
  },
  getPost: (slug) => request(`/posts/${encodeURIComponent(slug)}`),
  getCategories: () => request('/categories'),
  getLatest: () => request('/latest'),
  getSettings: () => request('/settings'),
  search: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/search${qs ? '?' + qs : ''}`);
  },

  // admin posts
  adminListPosts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/posts${qs ? '?' + qs : ''}`);
  },
  adminGetPost: (id) => request(`/admin/posts/${id}`),
  adminCreatePost: (payload) => request('/admin/posts', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdatePost: (id, payload) => request(`/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeletePost: (id) => request(`/admin/posts/${id}`, { method: 'DELETE' }),
  adminSetStatus: (id, status) => request(`/admin/posts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // admin categories
  adminListCategories: () => request('/admin/categories'),
  adminCreateCategory: (payload) => request('/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  adminUpdateCategory: (id, payload) => request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  adminDeleteCategory: (id) => request(`/admin/categories/${id}`, { method: 'DELETE' }),

  // admin users
  adminListUsers: () => request('/admin/users'),
  adminCreateUser: (payload) => request('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),
  adminDeleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // media
  adminListMedia: (q) => request(`/admin/media${q ? '?q=' + encodeURIComponent(q) : ''}`),
  adminDeleteMedia: (id) => request(`/admin/media/${id}`, { method: 'DELETE' }),
  adminUploadMedia: (file, altText = '', onProgress) => {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', file);
      if (altText) fd.append('alt_text', altText);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', BASE + '/admin/media/upload');
      const token = getToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.error || 'Upload failed'));
        } catch (e) { reject(e); }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(fd);
    });
  }
};
