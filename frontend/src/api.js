const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Team
  getTeam: () => request('/api/team'),
  addMember: (name, color) => request('/api/team', { method: 'POST', body: JSON.stringify({ name, color }) }),
  removeMember: (id) => request(`/api/team/${id}`, { method: 'DELETE' }),

  // Chores
  getChores: () => request('/api/chores'),
  addChore: (data) => request('/api/chores', { method: 'POST', body: JSON.stringify(data) }),
  updateChore: (id, data) => request(`/api/chores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChore: (id) => request(`/api/chores/${id}`, { method: 'DELETE' }),

  // Instances
  getInstances: (start, end) => request(`/api/instances?start=${start}&end=${end}`),
  updateInstance: (id, data) => request(`/api/instances/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  generateInstances: (start, end) => request('/api/instances/generate', { method: 'POST', body: JSON.stringify({ start, end }) }),
};
