const API_BASE = '/api';

export function getAuthHeader() {
  const token = localStorage.getItem('cityfix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  login: async (identifier, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, phone: identifier, email: identifier, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json();
  },

  register: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update profile');
    return res.json();
  },

  // Issues
  getIssues: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/issues?${query}`);
    if (!res.ok) throw new Error('Failed to fetch issues');
    return res.json();
  },

  getNearbyIssues: async (lat, lng, radius = 500) => {
    const res = await fetch(`${API_BASE}/issues/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!res.ok) throw new Error('Failed to fetch nearby issues');
    return res.json();
  },

  checkDuplicates: async (lat, lng, category) => {
    const res = await fetch(`${API_BASE}/issues/check-duplicates?lat=${lat}&lng=${lng}&category=${category}`);
    if (!res.ok) throw new Error('Failed to check duplicates');
    return res.json();
  },

  getIssueById: async (id) => {
    const res = await fetch(`${API_BASE}/issues/${id}`);
    if (!res.ok) throw new Error('Issue not found');
    return res.json();
  },

  createIssue: async (formData) => {
    const res = await fetch(`${API_BASE}/issues`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: formData // FormData with file or JSON
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit report');
    return res.json();
  },

  updateIssueStatus: async (id, updateData) => {
    const isFormData = typeof FormData !== 'undefined' && updateData instanceof FormData;
    const headers = isFormData 
      ? getAuthHeader() 
      : { 'Content-Type': 'application/json', ...getAuthHeader() };
    const body = isFormData ? updateData : JSON.stringify(updateData);

    const res = await fetch(`${API_BASE}/issues/${id}/status`, {
      method: 'PATCH',
      headers,
      body
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update status');
    return res.json();
  },

  submitIssueFeedback: async (id, feedbackData) => {
    const res = await fetch(`${API_BASE}/issues/${id}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(feedbackData)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to submit citizen feedback');
    return res.json();
  },

  toggleUpvote: async (id) => {
    const res = await fetch(`${API_BASE}/issues/${id}/upvote`, {
      method: 'POST',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to upvote');
    return res.json();
  },

  getCategories: async () => {
    const res = await fetch(`${API_BASE}/issues/meta/categories`);
    return res.json();
  },

  getDepartments: async () => {
    const res = await fetch(`${API_BASE}/issues/meta/departments`);
    return res.json();
  },

  getHeatmap: async () => {
    const res = await fetch(`${API_BASE}/issues/heatmap`);
    return res.json();
  },

  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/issues/user/notifications`, {
      headers: getAuthHeader()
    });
    if (!res.ok) return [];
    return res.json();
  },

  markNotificationRead: async (id) => {
    const res = await fetch(`${API_BASE}/issues/user/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeader()
    });
    return res.json();
  },

  // Analytics
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  }
};
