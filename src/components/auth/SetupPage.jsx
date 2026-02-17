import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function SetupPage() {
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createOrganization, user, profile } = useAuthStore();
  const navigate = useNavigate();

  // If user already has an org, redirect
  if (profile?.organization_id) {
    navigate('/');
    return null;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setLoading(true);
    try {
      await createOrganization(orgName.trim());
      toast.success('Workspace created!');
      navigate('/');
    } catch (err) {
      toast.error('Failed to create workspace: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="icon">🏢</span>
          </div>
          <h1>Create your workspace</h1>
          <p>Set up an organization for your team</p>
        </div>

        <form onSubmit={handleCreate} className="auth-form">
          <div className="form-group">
            <label>Organization Name</label>
            <input
              type="text"
              className="form-input"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Inc."
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
