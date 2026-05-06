/* ============================================================
   api.js — API Helper + Token Management
   ============================================================ */
const API_BASE = 'http://localhost:5000/api';

const API = {
  getToken()        { return localStorage.getItem('blockid_token'); },
  setToken(token)   { localStorage.setItem('blockid_token', token); },
  removeToken()     { localStorage.removeItem('blockid_token'); localStorage.removeItem('blockid_user'); },
  getUser()         { const u = localStorage.getItem('blockid_user'); return u ? JSON.parse(u) : null; },
  setUser(user)     { localStorage.setItem('blockid_user', JSON.stringify(user)); },
  isLoggedIn()      { return !!this.getToken(); },

  async request(method, path, body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');
      headers['Authorization'] = `Bearer ${token}`;
    }
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  },

  get(path, auth = false)        { return this.request('GET',    path, null, auth); },
  post(path, body, auth = false) { return this.request('POST',   path, body, auth); },
  put(path, body, auth = false)  { return this.request('PUT',    path, body, auth); },
  delete(path, auth = false)     { return this.request('DELETE', path, null, auth); },

  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async register(payload) {
    const data = await this.post('/auth/register', payload);
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  logout() {
    this.removeToken();
    window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
    }
  }
};
