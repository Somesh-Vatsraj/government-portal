import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useCallback } from 'react';
import { api } from './api/api.js';

import PublicLayout from './components/PublicLayout.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import PostDetails from './pages/PostDetails.jsx';
import Search from './pages/Search.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminLogin from './admin/AdminLogin.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Posts from './admin/Posts.jsx';
import CreatePost from './admin/CreatePost.jsx';
import EditPost from './admin/EditPost.jsx';
import Categories from './admin/Categories.jsx';
import Media from './admin/Media.jsx';
import Users from './admin/Users.jsx';
import Settings from './admin/Settings.jsx';

export const AuthContext = createContext({ user: null, login: () => {}, logout: () => {}, ready: false });

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('gp_token');
    if (!token) { setReady(true); return; }
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => { localStorage.removeItem('gp_token'); setUser(null); })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback((token, u) => {
    localStorage.setItem('gp_token', token);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('gp_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, ready }}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/new" element={<CreatePost />} />
          <Route path="posts/:id/edit" element={<EditPost />} />
          <Route path="categories" element={<Categories />} />
          <Route path="media" element={<Media />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/:category" element={<CategoryPage />} />
          <Route path="/:category/:slug" element={<PostDetails />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}
