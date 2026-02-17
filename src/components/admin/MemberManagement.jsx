import React from 'react';
import { useTeamStore } from '../../stores/teamStore';
import { supabase } from '../../lib/supabase';
import { Shield, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MemberManagement() {
  const { members, removeMember } = useTeamStore();

  const handleRoleChange = async (profileId, role) => {
    if (!profileId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profileId);

    if (error) {
      toast.error('Failed to update role');
      return;
    }
    toast.success('Role updated');
  };

  return (
    <div>
      {members.map((m) => (
        <div key={m.id} className="member-item" style={{ gap: 12 }}>
          <span className="member-dot" style={{ background: m.color }} />
          <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>{m.name}</span>
          {m.profile_id && (
            <select
              className="form-select"
              style={{ width: 'auto', padding: '4px 28px 4px 8px', fontSize: '0.78rem' }}
              value={m.profile?.role || 'editor'}
              onChange={(e) => handleRoleChange(m.profile_id, e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          )}
          <button
            className="btn-icon btn-danger"
            style={{ padding: 3 }}
            onClick={() => removeMember(m.id)}
            title="Remove from team"
          >
            <UserX size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
