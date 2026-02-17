import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useTeamStore } from '../stores/teamStore';
import { useUiStore } from '../stores/uiStore';
import CategoryManager from '../components/admin/CategoryManager';
import MemberManagement from '../components/admin/MemberManagement';
import AuditLog from '../components/admin/AuditLog';
import { Save, Building, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { profile, organization, updateProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h2 style={{ marginBottom: 20 }}>Settings</h2>

      {/* Profile Settings */}
      <div className="settings-section">
        <h3><User size={14} /> Profile</h3>
        <div className="form-group">
          <label>Display Name</label>
          <input
            className="form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input className="form-input" value={profile?.email || ''} disabled />
        </div>
        <div className="form-group">
          <label>Role</label>
          <input className="form-input" value={profile?.role || ''} disabled />
        </div>
        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Organization Settings */}
      {isAdmin && (
        <div className="settings-section">
          <h3><Building size={14} /> Organization</h3>
          <div className="form-group">
            <label>Organization Name</label>
            <input className="form-input" value={organization?.name || ''} disabled />
          </div>
        </div>
      )}

      {/* Member Management */}
      {isAdmin && (
        <div className="settings-section">
          <h3><Shield size={14} /> Member Management</h3>
          <MemberManagement />
        </div>
      )}

      {/* Categories */}
      <div className="settings-section">
        <h3>Categories</h3>
        <CategoryManager />
      </div>

      {/* Audit Log */}
      {isAdmin && (
        <div className="settings-section">
          <h3>Audit Log</h3>
          <AuditLog />
        </div>
      )}
    </div>
  );
}
